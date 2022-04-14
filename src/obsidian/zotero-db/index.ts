import { EventEmitter } from "@ipc/emitter";
import { MsgFromObsidian } from "@ipc/msg-obs";
import { MsgFromDbWorker } from "@ipc/msg-worker";
import log from "@log";
import { RegularItem } from "@zt-types";
import type Fuse from "fuse.js";
import { FileSystemAdapter, Notice } from "obsidian";
import prettyHrtime from "pretty-hrtime";
import dbWorker from "web-worker:../../db-worker";

import type ZoteroPlugin from "../zt-main";
import NoticeBBTStatus from "./notice-bbt";

export default class ZoteroDb {
  // itemMap: Record<string, RegularItem> = {};

  private emitter = new EventEmitter<MsgFromDbWorker, MsgFromObsidian>(
    dbWorker("Zotero Database Worker", this.ConfigPath),
  );

  constructor(private plugin: ZoteroPlugin) {
    plugin.register(this.close.bind(this));
  }

  get ConfigPath() {
    const { adapter, configDir } = this.plugin.app.vault;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(configDir);
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
    return await this.emitter.invoke(
      "cb:openDb",
      this.mainDbPath,
      this.bbtDbPath,
    );
  }
  private async initIndex(lib: number, refresh = false) {
    await this.emitter.invoke("cb:initIndex", lib, refresh);
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ): Promise<Fuse.FuseResult<RegularItem>[]> {
    let exp = query.map<Fuse.Expression>((s) => ({ [matchField]: s }));
    const [result] = await this.emitter.invoke(
      "cb:query",
      lib,
      { $and: exp },
      { limit },
    );
    return result;
  }
  async getAll(
    limit = 20,
    lib = this.defaultLibId,
  ): Promise<Fuse.FuseResult<RegularItem>[]> {
    const [result] = await this.emitter.invoke("cb:query", lib, null, {
      limit,
    });
    return result;
  }

  private libs: { libraryID: number; name: string }[] | null = null;
  async getLibs(refresh = false) {
    try {
      if (refresh || !this.libs) {
        const [result] = await this.emitter.invoke("cb:getLibs");
        this.libs = result;
      }
    } catch (error) {
      if (!this.libs) this.libs = [{ libraryID: 1, name: "My Library" }];
      log.error(error);
    }
    return this.libs;
  }

  close() {
    this.emitter.close();
  }
}
