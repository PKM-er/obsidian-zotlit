import type Fuse from "fuse.js";
import { FileSystemAdapter, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import getLibsWorker from "web-worker:./workers/get-libs";
import indexCitationWorker from "web-worker:./workers/index-citation";

import { PromiseWebWorker } from "../promise-worker";
import log from "../utils/logger";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import type { indexCitationWorkerGetter, InitOut, QueryOut } from "./get-index";
import type { getLibsWorkerGetter, Output as LibsOutput } from "./get-libs";
import type { dbState, InputBase } from "./type";

export default class ZoteroDb {
  itemMap: Record<string, RegularItem> = {};

  workers: {
    getLibs: ReturnType<getLibsWorkerGetter>;
    indexCitation: ReturnType<indexCitationWorkerGetter>;
  } = {
    getLibs: new PromiseWebWorker(
      getLibsWorker("Get Zotero Library Info Worker", this.ConfigPath),
    ),
    indexCitation: new PromiseWebWorker(
      indexCitationWorker("Zotero Citations Worker", this.ConfigPath),
    ),
  };

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
    await this.refreshIndex();
    await this.getLibs();
    new Notice("ZoteroDB Initialization complete.");
    log.debug(
      `ZoteroDB Initialization complete. Took ${prettyHrtime(
        process.hrtime(start),
      )}`,
    );
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
      (await this.workers.indexCitation.postMessage({
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
      (await this.workers.indexCitation.postMessage({
        action: "query",
        pattern: { $and: exp },
        options: { limit },
        ...this.props,
      })) as QueryOut
    ).result;
  }
  async getAll(limit = 20): Promise<Fuse.FuseResult<RegularItem>[]> {
    return (
      (await this.workers.indexCitation.postMessage({
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
        const { result, dbState } = await this.workers.getLibs.postMessage(
          this.props,
        );
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
  }
}
