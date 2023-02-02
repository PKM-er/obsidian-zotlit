/* eslint-disable @typescript-eslint/naming-convention */
import workerpool from "@aidenlx/workerpool";
import type { DbConnParams } from "@obzt/database/api";
import dbWorker from "@obzt/db-worker";
import { Service } from "@ophidian/core";
import { assertNever } from "assert-never";
import { debounce, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import log, { LogSettings } from "@log";
import type { DbWorkerAPI } from "../api";
import { DatabaseSettings } from "./settings";

const createWorkerProxy = (pool: workerpool.WorkerPool) => {
  const placeholder = {} as Record<string, any>;
  const addProxiedMethod = (name: string) =>
    (placeholder[name] ??= (...args: any[]) => pool.exec(name, args));

  pool
    // @ts-expect-error https://github.com/josdejong/workerpool/blob/11bd7fd37853626c265ae02de396f12436c2fc6c/src/Pool.js#L167-L171
    .exec("methods")
    .then((methods: string[]) => methods.forEach(addProxiedMethod));

  return new Proxy(placeholder, {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      // cache the resulting function
      return addProxiedMethod(prop);
    },
  }) as DbWorkerAPI;
};

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
  }
  async onunload(): Promise<void> {
    await this.#instance.terminate();
    URL.revokeObjectURL(this.#url);
    this.#status = DatabaseStatus.NotInitialized;
    this.#nextRefresh = null;
  }

  #url = dbWorker();
  #instance = workerpool.pool(this.#url, {
    minWorkers: 1,
    maxWorkers: 1,
    workerType: "web",
    name: "Zotero Database Workers",
  });

  api = createWorkerProxy(this.#instance);

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
