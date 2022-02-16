import type Fuse from "fuse.js";
import { FileSystemAdapter, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import getLibsWorker from "web-worker:./workers/get-libs";
import indexCitationWorker from "web-worker:./workers/index-citation";

import { PromiseWebWorker } from "../promise-worker";
import { checkNodeInWorker } from "../utils";
import log from "../utils/logger";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import type { InitOut, Output as IndexOutput, QueryOut } from "./get-index";
import type { indexCitationWorkerGetter } from "./get-index";
import getIndexFunc from "./get-index";
import type { getLibsWorkerGetter, Output as LibsOutput } from "./get-libs";
import getLibsFunc from "./get-libs";
import type { dbState, InputBase } from "./type";

export default class ZoteroDb {
  itemMap: Record<string, RegularItem> = {};

  workers: {
    indexCitation: ReturnType<indexCitationWorkerGetter>;
    getLibs: ReturnType<getLibsWorkerGetter>;
  } | null = null;
  fallbackSyncMethods = {
    indexCitation: getIndexFunc,
    getLibs: getLibsFunc,
  };
  do<K extends keyof ZoteroDb["fallbackSyncMethods"]>(
    method: K,
    ...args: Parameters<ZoteroDb["fallbackSyncMethods"][K]>
  ): ReturnType<ZoteroDb["fallbackSyncMethods"][K]> {
    if (this.workers) {
      // @ts-ignore
      return this.workers[method].postMessage(...args);
    } else {
      // @ts-ignore
      return this.fallbackSyncMethods[method](...args);
    }
  }

  constructor(private plugin: ZoteroPlugin) {
    plugin.register(this.close.bind(this));
  }

  dbState: dbState = {
    main: "main",
    bbt: "main",
  };
  private get props(): InputBase {
    const { settings } = this.plugin;
    return {
      mainDbPath: settings.zoteroDbPath,
      bbtDbPath: settings.betterBibTexDbPath,
      libraryID: settings.citationLibrary,
      dbState: this.dbState,
      logLevel: settings.logLevel,
    };
  }

  get ConfigPath() {
    const { adapter, configDir } = this.plugin.app.vault;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(configDir);
    } else throw new Error("Unsupported adapter");
  }

  async init() {
    const start = process.hrtime();
    if (await checkNodeInWorker()) {
      new Notice("Initializing ZoteroDB with worker...");
      await this.initAsync();
    } else {
      this.initSync();
    }
    await this.refreshIndex();
    await this.getLibs();
    new Notice("ZoteroDB Initialization complete.");
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
  }

  private initSync() {
    if (this.workers) {
      this.closeWorkers();
    }
  }
  private async initAsync() {
    if (!this.workers) {
      this.workers = {
        getLibs: new PromiseWebWorker(
          getLibsWorker("Get Zotero Library Info Worker", this.ConfigPath),
        ),
        indexCitation: new PromiseWebWorker(
          indexCitationWorker("Zotero Citations Worker", this.ConfigPath),
        ),
      };
    }
  }

  async refreshIndex(force = false) {
    if (force) {
      // force fetching data from main database
      this.dbState = {
        main: "main",
        bbt: "main",
      };
    }
    this.initIndexAndFuse(
      (await this.do("indexCitation", {
        action: "init",
        ...this.props,
      })) as InitOut,
    );
  }

  private initIndexAndFuse(args: InitOut) {
    const { itemMap, dbState } = args;
    this.itemMap = itemMap;
    this.dbState = dbState;
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
  ): Promise<Fuse.FuseResult<RegularItem>[]> {
    let exp = query.map<Fuse.Expression>((s) => ({ [matchField]: s }));
    return (
      (await this.do("indexCitation", {
        action: "query",
        pattern: { $and: exp },
        options: { limit },
        ...this.props,
      })) as QueryOut
    ).result;
  }
  async getAll(limit = 20): Promise<Fuse.FuseResult<RegularItem>[]> {
    return (
      (await this.do("indexCitation", {
        action: "query",
        pattern: null,
        options: { limit },
        ...this.props,
      })) as QueryOut
    ).result;
  }

  private libs: LibsOutput["result"] | null = null;
  async getLibs(refresh = false) {
    try {
      if (refresh || !this.libs) {
        const { result, dbState } = await this.do("getLibs", this.props);
        this.libs = result;
        this.dbState = dbState;
      }
    } catch (error) {
      if (!this.libs) this.libs = [{ libraryID: 1, name: "My Library" }];
      log.error(error);
    }
    return this.libs;
  }

  close() {
    this.closeWorkers();
  }
  closeWorkers() {
    for (const worker of Object.values(this.workers ?? {})) {
      worker.terminate();
    }
    this.workers = null;
  }
}
