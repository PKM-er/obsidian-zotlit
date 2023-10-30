/* eslint-disable @typescript-eslint/naming-convention */
import type { INotifyRegularItem } from "@obzt/protocol";
import { Service, calc, effect } from "@ophidian/core";
import { assertNever } from "assert-never";
import { App, debounce, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import log from "@/log";
import { Server } from "@/services/server/service";
import { SettingsService, skip } from "@/settings/base";
import { CancelledError, TimeoutError, untilDbRefreshed } from "@/utils/once";
import ZoteroPlugin from "@/zt-main";
import { DatabaseWorkerPool } from "./worker";

export const enum DatabaseStatus {
  NotInitialized,
  Pending,
  Ready,
}

export default class Database extends Service {
  settings = this.use(SettingsService);
  app = this.use(App);
  plugin = this.use(ZoteroPlugin);
  server = this.use(Server);

  @calc get zoteroDataDir(): string {
    return this.settings.current?.zoteroDataDir;
  }

  onload() {
    log.debug("loading DatabaseWorker");
    this.settings.once(async () => {
      const onDatabaseUpdate = debounce(
        () => this.refresh({ task: "dbConn" }),
        500,
        true,
      );
      this.registerEvent(
        this.app.vault.on("zotero:db-updated", () => onDatabaseUpdate()),
      );
      const start = process.hrtime();
      await this.initialize();
      log.debug(
        `ZoteroDB Initialization complete. Took ${prettyHrtime(
          process.hrtime(start),
        )}`,
      );

      const requestRefresh = this.genAutoRefresh(this.plugin);
      this.registerEvent(
        this.server.on("bg:notify", async (_, data) => {
          if (data.event !== "regular-item/update") return;
          requestRefresh(data);
        }),
      );
      this.plugin.addCommand({
        id: "refresh-zotero-data",
        name: "Refresh Zotero data",
        callback: async () => {
          await this.refresh({ task: "full" });
        },
      });
      this.plugin.addCommand({
        id: "refresh-zotero-search-index",
        name: "Refresh Zotero search index",
        callback: async () => {
          await this.refresh({ task: "searchIndex" });
        },
      });
    });
    this.register(
      effect(
        skip(
          async () => {
            if (this.status === DatabaseStatus.NotInitialized) {
              await this.initialize();
            } else {
              await this.refresh({ task: "full" });
            }
          },
          () => this.zoteroDataDir,
        ),
      ),
    );
    this.register(
      effect(
        skip(
          async () => {
            await this.refresh({
              task: "searchIndex",
              force: true,
            });
            new Notice("Zotero search index updated.");
          },
          () => this.settings.libId,
          true,
        ),
      ),
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
    this.#status = DatabaseStatus.NotInitialized;
    this.#nextRefresh = null;
  }

  #instance = new DatabaseWorkerPool({
    minWorkers: 1,
    maxWorkers: 1,
  });

  get api() {
    return this.#instance.proxy;
  }

  #status: DatabaseStatus = DatabaseStatus.NotInitialized;
  get status() {
    return this.#status;
  }

  #indexedLibrary: number | null = null;

  async #initSearch(force: boolean) {
    const libToIndex = this.settings.libId;
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

  async #openDbConn() {
    const [paths, opts] = this.settings.dbConnParams;

    const { main, bbtMain, bbtSearch } = await this.api.openDb(paths, opts);
    if (!bbtMain || bbtSearch === false) {
      log.debug("Failed to open Better BibTeX database, skipping...");
    }
    if (!main) {
      throw new Error("Failed to init ZoteroDB");
    }
  }

  // #region Initialization, called internally on load
  async initialize() {
    if (this.#status !== DatabaseStatus.NotInitialized) {
      throw new Error(
        `Calling init on already initialized db, use refresh instead`,
      );
    }
    await this.#openDbConn();
    this.app.vault.trigger("zotero:db-ready");
    await this.#initSearch(true);
    this.app.metadataCache.trigger("zotero:search-ready");
    log.info("ZoteroDB Initialization complete.");

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
    await this.#openDbConn();
    this.app.vault.trigger("zotero:db-refresh");
  }
  async #refreshSearchIndex(force = false) {
    if (await this.#initSearch(force)) {
      this.app.metadataCache.trigger("zotero:search-refresh");
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
