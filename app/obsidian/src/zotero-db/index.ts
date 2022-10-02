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

  initialized = false;
  #initPromise = new Promise<void>((resolve) => {
    this.initResolve = resolve;
  });
  private initResolve!: (value: void | PromiseLike<void>) => void;

  /** calling this will reload database worker */
  async init() {
    const start = process.hrtime();
    const [mainOpened, bbtOpened] = await this.#openDatabase();
    const inited = () => {
      this.initialized = true;
      this.initResolve();
    };
    if (this.bbtDbPath && !bbtOpened) {
      log.warn("Better BibTex database not found");
      new NoticeBBTStatus(this.#plugin);
      inited();
      return;
    }
    if (mainOpened) {
      await this.#initIndex(this.defaultLibId);
      await this.getLibs();
      inited();
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

  async #openDatabase() {
    const proxy = await this.#proxy;
    return await proxy.openDb(this.configPath, this.mainDbPath, this.bbtDbPath);
  }

  #indexed = false;
  async #initIndex(lib = this.defaultLibId) {
    const proxy = await this.#proxy;
    await proxy.initIndex(lib);
    this.#libs = await proxy.getLibs();
  }
  #initIndexTask: Promise<void> | null = null;
  async initIndex(force = false) {
    // wait for db refresh
    if (this.#initDbTask) {
      await this.#initDbTask;
    }
    // since database is opened as immutable one
    // if index is already initialized, skip
    if (this.#indexed && !force) return;
    if (!this.#initIndexTask) {
      this.#initIndexTask = this.#initIndex().then(() => {
        this.#indexed = true;
      });
    }
    await this.#initIndexTask;
    this.#initIndexTask = null;
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
    await this.#initPromise;
    const proxy = await this.#proxy;
    return await proxy.getItem(item, lib);
  }

  #initDbTask: Promise<void> | null = null;
  #waitingInitDb = false;
  async #initDbConnection() {
    const proxy = await this.#proxy;
    await proxy.initDbConnection();

    if (!this.#waitingInitDb) {
      this.#initDbTask = null;
      // connection refresh done
    } else {
      this.#waitingInitDb = false;
      // continue to query
      await this.#initDbConnection();
    }
  }
  async initDbConnection() {
    if (!this.#initDbTask) {
      // if no task is running, start a new one
      this.#initDbTask = this.#initDbConnection().then(() => {
        this.#indexed = false;
      });
    } else {
      this.#waitingInitDb = true;
    }
    return this.#initDbTask;
  }

  async fullRefresh() {
    await this.initDbConnection();
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
    await this.#initPromise;
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await (
      await this.#proxy
    ).query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    await this.#initPromise;
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
