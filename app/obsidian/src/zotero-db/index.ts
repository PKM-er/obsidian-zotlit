import type { LogLevel } from "@obzt/common";
import type { DbWorkerAPI } from "@obzt/database";
import dbWorker from "@obzt/database";
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

  constructor(private plugin: ZoteroPlugin) {
    plugin.register(this.close.bind(this));
    const url = dbWorker();
    this.#pool = workerpool.pool(url, {
      minWorkers: 1,
      maxWorkers: 1,
      workerType: "web",
    });
    this.#proxy = this.#pool.proxy();
    this.setLoglevel(this.plugin.settings.logLevel);
    URL.revokeObjectURL(url);
  }

  #configPath?: string;
  get configPath(): string {
    if (this.#configPath) return this.#configPath;
    const { adapter, configDir } = this.plugin.app.vault;
    if (adapter instanceof FileSystemAdapter) {
      this.#configPath = adapter.getFullPath(configDir);
      return this.#configPath;
    } else throw new Error("Unsupported adapter");
  }
  get defaultLibId() {
    return this.plugin.settings.citationLibrary;
  }
  get mainDbPath() {
    return this.plugin.settings.zoteroDbPath;
  }
  get bbtDbPath() {
    return this.plugin.settings.betterBibTexDbPath;
  }

  async setLoglevel(level: LogLevel) {
    const proxy = await this.#proxy;
    await proxy.setLoglevel(level);
  }

  /** calling this will reload database worker */
  async init() {
    const start = process.hrtime();
    const [mainOpened, bbtOpened] = await this.openDatabase();
    if (this.bbtDbPath && !bbtOpened) {
      log.warn("Better BibTex database not found");
      new NoticeBBTStatus(this.plugin);
      return;
    }
    if (mainOpened) {
      await this.initIndex(this.defaultLibId);
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
  public refreshIndex() {
    return this.initIndex(this.defaultLibId, true);
  }

  private async openDatabase() {
    const proxy = await this.#proxy;
    return await proxy.openDb(this.configPath, this.mainDbPath, this.bbtDbPath);
  }
  private async initIndex(lib: number, refresh = false) {
    const proxy = await this.#proxy;
    await proxy.initIndex(lib, refresh);
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ) {
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await (
      await this.#proxy
    ).query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    const result = await (
      await this.#proxy
    ).query(lib, null, {
      limit,
    });
    return result;
  }

  private libs: { libraryID: number; name: string }[] | null = null;
  async getLibs(refresh = false) {
    try {
      if (refresh || !this.libs) {
        const result = await (await this.#proxy).getLibs();
        this.libs = result;
      }
    } catch (error) {
      if (!this.libs) this.libs = [{ libraryID: 1, name: "My Library" }];
      log.error(error);
    }
    return this.libs;
  }

  close(force = false) {
    this.#pool.terminate(force);
  }
}
