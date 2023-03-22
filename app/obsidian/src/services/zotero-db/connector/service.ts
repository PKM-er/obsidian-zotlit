/* eslint-disable @typescript-eslint/naming-convention */
import { toObjectURL } from "@aidenlx/esbuild-plugin-inline-worker/utils";
import workerpool from "@aidenlx/workerpool";
import type { DbConnParams } from "@obzt/database/api";
import type { INotifyRegularItem } from "@obzt/protocol";
import { Service } from "@ophidian/core";
import { assertNever } from "assert-never";
import { debounce, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import dbWorker from "worker:@obzt/db-worker";
import log, { LogSettings } from "@/log";
import { CancelledError, TimeoutError, untilDbRefreshed } from "@/utils/once";
import { createWorkerProxy } from "@/utils/worker";
import ZoteroPlugin from "@/zt-main";
import type { DbWorkerAPI } from "../api";
import { DatabaseSettings } from "./settings";

export const enum DatabaseStatus {
  NotInitialized,
  Pending,
  Ready,
}

export default class DatabaseWorker extends Service {
  logSettings = this.use(LogSettings);
  settings = this.use(DatabaseSettings);
  async onload() {
    log.debug("loading DatabaseWorker");
    const onDatabaseUpdate = debounce(
      () => {
        this.refresh({ task: "dbConn" });
      },
      500,
      true,
    );
    this.registerEvent(
      app.vault.on("zotero:db-updated", () => onDatabaseUpdate()),
    );
    const start = process.hrtime();
    await this.initialize();
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
    const plugin = this.use(ZoteroPlugin);
    plugin.addCommand({
      id: "refresh-zotero-data",
      name: "Refresh Zotero Data",
      callback: async () => {
        await this.refresh({ task: "full" });
      },
    });
    plugin.addCommand({
      id: "refresh-zotero-search-index",
      name: "Refresh Zotero Search Index",
      callback: async () => {
        await this.refresh({ task: "searchIndex" });
      },
    });

    const requestRefresh = this.genAutoRefresh(plugin);
    this.registerEvent(
      plugin.server.on("bg:notify", async (_, data) => {
        if (data.event !== "regular-item/update") return;
        requestRefresh(data);
      }),
    );
  }
  private genAutoRefresh(plugin: ZoteroPlugin) {
    let dbRefreshed = false;
    let _cancel: (() => void) | null = null;
    const cancelWaitRefresh = () => {
      if (!_cancel) return;
      log.debug("unregistering db refresh watcher");
      _cancel();
      _cancel = null;
    };
    const tryRefresh = debounce(
      async () => {
        cancelWaitRefresh();
        log.debug("Auto Refreshing Zotero Search Index");
        if (!dbRefreshed) {
          dbRefreshed = false;
          try {
            log.debug("Db not refreshed, waiting before auto refresh");
            const [task] = untilDbRefreshed(plugin.app, { timeout: 10e3 });
            await task;
          } catch (error) {
            if (error instanceof TimeoutError) {
              log.warn(
                "no db refreshed event received in 10s, skip refresh search index",
              );
              return;
            } else {
              console.error(
                "error while waiting for db refresh during execute",
                error,
              );
              return;
            }
          }
        }
        await this.refresh({ task: "searchIndex", force: true });
        log.debug("Auto Refreshing Zotero Search Index Success");
      },
      5000,
      true,
    );
    return (data: INotifyRegularItem) => {
      log.debug(
        `Request to auto refresh search index: (refreshed ${dbRefreshed})`,
        data,
      );
      tryRefresh();
      cancelWaitRefresh();
      if (dbRefreshed) return;
      log.debug(
        "watching db refresh while waiting for search index auto refresh",
      );
      const [task, cancel] = untilDbRefreshed(plugin.app, { timeout: null });
      _cancel = cancel;
      task
        .then(() => {
          log.debug("db refresh while requesting auto refresh search index");
          dbRefreshed = true;
          _cancel = null;
        })
        .catch((err) => {
          if (err instanceof CancelledError) return;
          console.error(
            "error while waiting for db refresh during request",
            err,
          );
        });
    };
  }

  async onunload(): Promise<void> {
    await this.#instance.terminate();
    URL.revokeObjectURL(this.#url);
    this.#status = DatabaseStatus.NotInitialized;
    this.#nextRefresh = null;
  }

  #url = toObjectURL(dbWorker);
  #instance = workerpool.pool(this.#url, {
    minWorkers: 1,
    maxWorkers: 1,
    workerType: "web",
    name: "Zotero Database Workers",
  });

  api = createWorkerProxy<DbWorkerAPI>(this.#instance);

  #status: DatabaseStatus = DatabaseStatus.NotInitialized;
  get status() {
    return this.#status;
  }

  #indexedLibrary: number | null = null;
  #connectedDbId: string | null = null;
  toConnectedDbId(params: Pick<DbConnParams, "bbtDbPath" | "mainDbPath">) {
    return [params.mainDbPath, params.bbtDbPath].join();
  }

  async #initSearch(force: boolean) {
    const libToIndex = this.settings.citationLibrary;
    if (!force && this.#indexedLibrary === libToIndex) {
      log.debug(
        `Skipping search index init, lib ${libToIndex} already indexed`,
      );
      return false;
    }
    await this.api.initIndex(libToIndex);
    this.#indexedLibrary = libToIndex;
    log.debug(`Search index init complete for lib ${libToIndex}`);
    return true;
  }

  async #openDbConn(refresh = false) {
    const params = this.settings.dbConnParams,
      newDbId = this.toConnectedDbId(params);

    let result;
    if (!refresh) {
      // init database
      result = await this.api.openDb(params);
      this.#connectedDbId = newDbId;
    } else if (newDbId !== this.#connectedDbId) {
      // open conn to new database
      delete (params as Partial<DbConnParams>).nativeBinding;
      result = await this.api.openDb(params);
      this.#connectedDbId = newDbId;
    } else {
      // refresh existing database conn
      result = await this.api.openDb();
    }

    const [mainOpened, bbtOpened] = result;
    if (!bbtOpened) {
      log.debug("Failed to open Better BibTeX database, skipping...");
    }
    if (!mainOpened) {
      throw new Error("Failed to init ZoteroDB");
    }
  }

  // #region Initialization, called internally on load
  private async initialize() {
    if (this.#status !== DatabaseStatus.NotInitialized) {
      throw new Error(
        `Calling init on already initialized db, use refresh instead`,
      );
    }
    await this.#openDbConn();
    app.vault.trigger("zotero:db-ready");
    await this.#initSearch(true);
    app.metadataCache.trigger("zotero:search-ready");
    new Notice("ZoteroDB Initialization complete.");

    this.#status = DatabaseStatus.Ready;
  }
  // #endregion

  // #region Refresh
  #pendingRefresh: Promise<void> | null = null;
  #nextRefresh: RefreshTask | null = null;
  public refresh(param: RefreshTask): Promise<void> {
    if (this.#status === DatabaseStatus.NotInitialized) {
      return Promise.reject(
        new Error(`Calling refresh on uninitialized database`),
      );
    }
    if (this.#status === DatabaseStatus.Ready) {
      this.#status = DatabaseStatus.Pending;
      const pending = (async () => {
        if (param.task === "dbConn") {
          await this.#refreshDbConn();
        } else if (param.task === "searchIndex") {
          await this.#refreshSearchIndex(param.force);
        } else if (param.task === "full") {
          await this.#fullRefresh();
        } else assertNever(param);
        this.#status = DatabaseStatus.Ready;
        const nextTask = this.#nextRefresh;
        if (nextTask) {
          this.#nextRefresh = null;
          await this.refresh(nextTask);
        }
      })();
      return (this.#pendingRefresh = pending);
    } else if (this.#status === DatabaseStatus.Pending) {
      if (!this.#pendingRefresh)
        return Promise.reject(new Error("Other task in pending state"));
      this.#nextRefresh = this.#mergeTask(param);
      return this.#pendingRefresh;
    } else {
      assertNever(this.#status);
    }
  }
  async #refreshDbConn() {
    await this.#openDbConn(true);
    app.vault.trigger("zotero:db-refresh");
  }
  async #refreshSearchIndex(force = false) {
    if (await this.#initSearch(force)) {
      app.metadataCache.trigger("zotero:search-refresh");
    }
  }
  async #fullRefresh() {
    await this.#refreshDbConn();
    await this.#refreshSearchIndex(true);
    new Notice("ZoteroDB Refresh complete.");
  }
  #mergeTask(curr: RefreshTask): RefreshTask {
    if (!this.#nextRefresh) return curr;
    const prev = this.#nextRefresh;
    if (prev.task === "full") return prev;
    if (prev.task === curr.task) {
      if (prev.task === "searchIndex") {
        return {
          ...prev,
          force: prev.force || (curr as RefreshSearchIndexTask).force,
        };
      } else {
        return prev;
      }
    }
    return { task: "full" };
  }
  // #endregion
}

declare module "obsidian" {
  interface Vault {
    on(name: "zotero:db-ready", callback: () => any, ctx?: any): EventRef;
    on(name: "zotero:db-refresh", callback: () => any, ctx?: any): EventRef;
    trigger(name: "zotero:db-ready"): void;
    trigger(name: "zotero:db-refresh"): void;
  }
  interface MetadataCache {
    on(name: "zotero:search-ready", callback: () => any, ctx?: any): EventRef;
    on(name: "zotero:search-refresh", callback: () => any, ctx?: any): EventRef;
    trigger(name: "zotero:search-ready"): void;
    trigger(name: "zotero:search-refresh"): void;
  }
}

interface RefreshDbConnTask {
  task: "dbConn";
}
interface RefreshSearchIndexTask {
  task: "searchIndex";
  force?: boolean;
}
interface RefreshFullTask {
  task: "full";
}

type RefreshTask = RefreshDbConnTask | RefreshSearchIndexTask | RefreshFullTask;
