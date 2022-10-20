import type { FSWatcher } from "fs";
import { watch } from "fs";
import workerpool from "@aidenlx/workerpool";
import type { LogLevel } from "@obzt/common";
import type { DbWorkerAPI } from "@obzt/database";
import dbWorker from "@obzt/database";
import type { GeneralItem, LibraryInfo } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import type { EventRef } from "obsidian";
import { Events, debounce, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import log from "@log";

import { getBinaryFullPath } from "../install-guide/version.js";
import type ZoteroPlugin from "../zt-main.js";

export default class ZoteroDb extends Events {
  // itemMap: Record<string, RegularItem> = {};

  #pool: workerpool.WorkerPool;
  #proxy: workerpool.Promise<workerpool.Proxy<DbWorkerAPI>, Error>;
  #plugin: ZoteroPlugin;
  constructor(plugin: ZoteroPlugin) {
    super();
    this.#plugin = plugin;
    const url = dbWorker();
    this.#pool = workerpool.pool(url, {
      minWorkers: 1,
      maxWorkers: 1,
      workerType: "web",
      name: "Zotero Database Workers",
    });
    this.#proxy = this.#pool.proxy();
    this.setLoglevel(plugin.settings.logLevel);
    this.setAutoRefresh(plugin.settings.autoRefresh);
    plugin.register(() => {
      URL.revokeObjectURL(url);
      this.close();
    });

    if (process.env.NODE_ENV === "development") {
      // expose proxy in dev env
      Object.defineProperty(this, "proxy", {
        get() {
          return this.#proxy;
        },
      });
    }
  }

  #nativeBinding?: string;
  get nativeBinding(): string {
    if (this.#nativeBinding) return this.#nativeBinding;
    const binaryFullPath = getBinaryFullPath(this.#plugin.manifest);
    if (binaryFullPath) {
      this.#nativeBinding = binaryFullPath;
      return this.#nativeBinding;
    } else throw new Error("Failed to get native binding path");
  }
  get defaultLibId() {
    return this.#plugin.settings.citationLibrary;
  }
  get mainDbPath() {
    return this.#plugin.settings.zoteroDbPath;
  }
  get bbtDbPath() {
    return this.#plugin.settings.betterBibTexDbPath;
  }

  async setLoglevel(level: LogLevel) {
    const proxy = await this.#proxy;
    await proxy.setLoglevel(level);
  }

  watcher: Record<"main" | "bbt", FSWatcher | null> = {
    main: null,
    bbt: null,
  };
  #autoRefresh = debounce(this.#refreshDbConn.bind(this), 500, true);
  #autoRefreshEnabled = false;
  #unloadWatchers() {
    for (const k in this.watcher) {
      const key = k as keyof ZoteroDb["watcher"];
      this.watcher[key]?.close();
      this.watcher[key] = null;
    }
  }
  async setAutoRefresh(val: boolean, force = false) {
    if (val === this.#autoRefreshEnabled && !force) return;
    log.info("Auto refresh set to " + val);
    this.#autoRefreshEnabled = val;
    this.#unloadWatchers();
    if (val) {
      if (this.#dbInited) {
        await this.#refreshDbConn();
      }
      this.watcher.main = watch(this.mainDbPath, this.#autoRefresh);
      if (await this.checkDbStatus("bbt")) {
        this.watcher.bbt = watch(this.bbtDbPath, this.#autoRefresh);
      }
    }
  }

  async checkDbStatus(name: "main" | "bbt"): Promise<boolean> {
    const proxy = await this.#proxy;
    return await proxy.checkDbStatus(name);
  }
  /** calling this will reload database worker */
  async init() {
    const start = process.hrtime();
    const [mainOpened, bbtOpened] = await this.openDbConn();
    if (!bbtOpened) {
      log.info("Failed to open Better BibTeX database, skipping...");
      // return;
    }
    if (mainOpened) {
      await this.initIndex(true);
    } else {
      throw new Error("Failed to init ZoteroDB");
    }

    new Notice("ZoteroDB Initialization complete.");
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: "refresh", callback: () => any): EventRef;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(name: string, callback: (...data: any) => any, ctx?: any): EventRef {
    return super.on(name, callback, ctx);
  }

  #dbInited = false;
  #initDbTask: Promise<[mainDbResult: boolean, bbtDbResult: boolean]> | null =
    null;
  #waitingInitDb = false;
  async #refreshDbConn() {
    const proxy = await this.#proxy;
    let result = await proxy.refreshDb();

    if (!this.#waitingInitDb) {
      log.debug("no waiting task in queue, resolve init db task");
      // connection refresh done
    } else {
      this.#waitingInitDb = false;
      log.debug("current task done, continue init db task in queue");
      // continue to query
      result = await this.#refreshDbConn();
    }
    log.debug("refresh db conn done");
    this.trigger("refresh");
    return result;
  }
  async #openDbConn() {
    if (this.#dbInited) {
      log.debug(
        `Database already initialized, reopen with new params: ${[
          this.nativeBinding,
          this.mainDbPath,
          this.bbtDbPath,
        ]}`,
      );
    }
    const proxy = await this.#proxy;
    const result = await proxy.openDb(
      this.nativeBinding,
      this.mainDbPath,
      this.bbtDbPath,
    );
    log.debug("open db conn done");
    return result;
  }

  async #execOpenDbConnTask(
    refresh: boolean,
    pending: Promise<[mainDbResult: boolean, bbtDbResult: boolean]> | null,
  ) {
    let result;
    if (pending) {
      if (!refresh) {
        log.warn("Database already initializing");
      } else {
        log.debug("Database already initializing, send to queue");
        this.#waitingInitDb = true;
      }
      result = await pending;
      log.debug("pending init db task done");
    } else {
      if (!refresh) {
        result = await this.#openDbConn();
        this.#dbInited = true;
      } else {
        result = await this.#refreshDbConn();
      }
      this.#indexed = false;
    }
    return result;
  }

  openDbConn(
    refresh = false,
  ): Promise<[mainDbResult: boolean, bbtDbResult: boolean]> {
    const task = this.#execOpenDbConnTask(refresh, this.#initDbTask).finally(
      () => (this.#initDbTask = null),
    );
    this.#initDbTask = task;
    return task;
  }

  #indexed = false;
  async #initIndex(lib = this.defaultLibId) {
    const proxy = await this.#proxy;
    await proxy.initIndex(lib);
    this.#libs = await proxy.getLibs();
  }
  private initIndexTask: Promise<void> | null = null;
  get #initIndexTask() {
    return this.initIndexTask;
  }
  set #initIndexTask(val) {
    this.initIndexTask = val;
  }
  async #execInitIndexTask(force: boolean, pending: Promise<void> | null) {
    // if db conn is initializing, continue after it's done
    if (this.#initDbTask) {
      await this.#initDbTask;
      log.debug("pending init db task finished");
    }
    if (pending) {
      await pending;
      log.debug("pending initIndex task finished");
    }
    let result;
    if (this.#indexed && !force) {
      // since database is opened as immutable one
      // if index is already initialized, skip
      result = void 0;
      log.debug("Index already initialized, skip");
    } else {
      log.debug("Index not initialized after init db, start indexing");
      result = await this.#initIndex();
      this.#indexed = true;
      log.debug("Index initialized");
    }
    return result;
  }
  async initIndex(force = false): Promise<void> {
    const task = this.#execInitIndexTask(force, this.#initIndexTask).finally(
      () => (this.initIndexTask = null),
    );
    this.#initIndexTask = task;
    return task;
  }

  async isUpToDate() {
    const proxy = await this.#proxy;
    return await proxy.isUpToDate();
  }

  async getAttachments(docId: number, libId = this.defaultLibId) {
    const proxy = await this.#proxy;
    return await proxy.getAttachments(docId, libId);
  }
  async getAnnotations(attachmentId: number, libId = this.defaultLibId) {
    const proxy = await this.#proxy;
    return await proxy.getAnnotations(attachmentId, libId);
  }
  async getAnnotFromKey(keys: string[], libId = this.defaultLibId) {
    const proxy = await this.#proxy;
    return await proxy.getAnnotFromKey(keys, libId);
  }
  async getTags(itemIDs: number[], libId = this.defaultLibId) {
    const proxy = await this.#proxy;
    return await proxy.getTags(itemIDs, libId);
  }
  async getItem(itemKey: string, lib?: number): Promise<GeneralItem | null>;
  async getItem(itemId: number, lib?: number): Promise<GeneralItem | null>;
  async getItem(
    item: string | number,
    lib = this.defaultLibId,
  ): Promise<GeneralItem | null> {
    await this.initIndex();
    const proxy = await this.#proxy;
    return await proxy.getItem(item, lib);
  }

  async fullRefresh() {
    await this.openDbConn();
    await this.initIndex();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async raw<R>(sql: string, args: any[]): Promise<R> {
    // wait for db refresh
    if (this.#initDbTask) {
      await this.#initDbTask;
    }
    const proxy = await this.#proxy;
    const result = await proxy.raw(sql, args);
    return result as R;
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ) {
    await this.initIndex();
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await (
      await this.#proxy
    ).query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    await this.initIndex();
    const result = await (
      await this.#proxy
    ).query(lib, null, {
      limit,
    });
    return result;
  }

  #libs: LibraryInfo[] | null = null;
  async getLibs() {
    try {
      if (!this.#libs) {
        const result = await (await this.#proxy).getLibs();
        this.#libs = result;
      }
    } catch (error) {
      if (!this.#libs)
        this.#libs = [{ libraryID: 1, type: "user", groupID: null }];
      log.error(error);
    }
    return this.#libs;
  }

  close(force = false) {
    this.#pool.terminate(force);
    this.#unloadWatchers();
    log.info("ZoteroDB unloaded");
  }
}
