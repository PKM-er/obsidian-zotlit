import type { LogLevel } from "@obzt/common";
import type { DbWorkerAPI } from "@obzt/database";
import dbWorker from "@obzt/database";
import type { GeneralItem, LibraryInfo } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import { FileSystemAdapter, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import workerpool from "workerpool";
import log from "@log";

import type ZoteroPlugin from "../zt-main.js";
import NoticeBBTStatus from "./notice-bbt.js";

export default class ZoteroDb {
  // itemMap: Record<string, RegularItem> = {};

  #pool: workerpool.WorkerPool;
  #proxy: workerpool.Promise<workerpool.Proxy<DbWorkerAPI>, Error>;
  #plugin: ZoteroPlugin;
  constructor(plugin: ZoteroPlugin) {
    this.#plugin = plugin;
    plugin.register(this.close.bind(this));
    const url = dbWorker();
    this.#pool = workerpool.pool(url, {
      minWorkers: 1,
      maxWorkers: 1,
      workerType: "web",
    });
    this.#proxy = this.#pool.proxy();
    this.setLoglevel(plugin.settings.logLevel);
    URL.revokeObjectURL(url);

    if (process.env.NODE_ENV === "development") {
      // expose proxy in dev env
      Object.defineProperty(this, "proxy", {
        get() {
          return this.#proxy;
        },
      });
    }
  }

  #configPath?: string;
  get configPath(): string {
    if (this.#configPath) return this.#configPath;
    const { adapter, configDir } = this.#plugin.app.vault;
    if (adapter instanceof FileSystemAdapter) {
      this.#configPath = adapter.getFullPath(configDir);
      return this.#configPath;
    } else throw new Error("Unsupported adapter");
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

  /** calling this will reload database worker */
  async init() {
    const start = process.hrtime();
    const [mainOpened, bbtOpened] = await this.openDbConn();
    if (this.bbtDbPath && !bbtOpened) {
      log.warn("Better BibTex database not found");
      new NoticeBBTStatus(this.#plugin);
      return;
    }
    if (mainOpened) {
      await this.#initIndex(this.defaultLibId);
      await this.getLibs();
    } else {
      log.error("Failed to init ZoteroDB");
    }

    new Notice("ZoteroDB Initialization complete.");
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
  }

  #dbInited = false;
  #initDbTask: Promise<[mainDbResult: boolean, bbtDbResult: boolean]> | null =
    null;
  #waitingInitDb = false;
  async #refreshDbConn() {
    const proxy = await this.#proxy;
    let result = await proxy.refreshDb();

    if (!this.#waitingInitDb) {
      this.#initDbTask = null;
      // connection refresh done
    } else {
      this.#waitingInitDb = false;
      // continue to query
      result = await this.#refreshDbConn();
    }
    return result;
  }
  async #openDbConn() {
    if (this.#dbInited) {
      log.debug(
        `Database already initialized, reopen with new params: ${[
          this.configPath,
          this.mainDbPath,
          this.bbtDbPath,
        ]}`,
      );
    }
    const proxy = await this.#proxy;
    return await proxy.openDb(this.configPath, this.mainDbPath, this.bbtDbPath);
  }

  async #execOpenDbConnTask(refresh: boolean) {
    const prevTask = this.#initDbTask;
    let result;
    if (prevTask) {
      if (!refresh) {
        log.warn("Database already initializing");
      } else {
        this.#waitingInitDb = true;
      }
      result = await prevTask;
    } else {
      if (!refresh) {
        result = await this.#openDbConn();
        this.#dbInited = true;
      } else {
        result = await this.#refreshDbConn();
      }
      this.#indexed = false;
    }
    this.#initDbTask = null;
    return result;
  }

  openDbConn(
    refresh = false,
  ): Promise<[mainDbResult: boolean, bbtDbResult: boolean]> {
    const task = this.#execOpenDbConnTask(refresh);
    this.#initDbTask = task;
    return task;
  }

  #indexed = false;
  async #initIndex(lib = this.defaultLibId) {
    const proxy = await this.#proxy;
    await proxy.initIndex(lib);
    this.#libs = await proxy.getLibs();
  }
  #initIndexTask: Promise<void> | null = null;
  async #execInitIndexTask(force: boolean) {
    // if db conn is initializing, continue after it's done
    if (this.#initDbTask) {
      await this.#initDbTask;
    }
    let result;
    if (this.#indexed && !force) {
      // since database is opened as immutable one
      // if index is already initialized, skip
      result = void 0;
    } else {
      result = await this.#initIndex();
      this.#indexed = true;
      this.#initIndexTask = null;
    }
    this.#initIndexTask = null;
    return result;
  }
  async initIndex(force = false): Promise<void> {
    const task = this.#execInitIndexTask(force);
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
  async getItem(itemKey: string, lib?: number): Promise<GeneralItem | null>;
  async getItem(itemId: number, lib?: number): Promise<GeneralItem | null>;
  async getItem(
    item: string | number,
    lib = this.defaultLibId,
  ): Promise<GeneralItem | null> {
    await this.#initDbTask;
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
    await this.#initIndexTask;
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await (
      await this.#proxy
    ).query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    await this.#initIndexTask;
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
  }
}
