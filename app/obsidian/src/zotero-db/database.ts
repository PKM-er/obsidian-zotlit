import { Service } from "@ophidian/core";
import type Fuse from "fuse.js";
import log from "@log";
import DatabaseWatcher from "./auto-refresh/service";
import DatabaseWorker, { DatabaseStatus } from "./connector/service";
import { DatabaseSettings } from "./connector/settings";

export class ZoteroDatabase extends Service {
  // async onload() {}

  onunload(): void {
    log.info("ZoteroDB unloaded");
  }

  get defaultLibId() {
    return this.settings.citationLibrary;
  }

  settings = this.use(DatabaseSettings);
  #worker = this.use(DatabaseWorker);

  watcher = this.use(DatabaseWatcher);
  get api() {
    return this.#worker.api;
  }

  async search(
    query: string[],
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ) {
    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const exp = query.map<Fuse.Expression>((s) => ({
      [matchField]: s,
    }));
    const result = await this.api.query(lib, { $and: exp }, { limit });
    return result;
  }
  async getAll(limit = 20, lib = this.defaultLibId) {
    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const result = await this.api.query(lib, null, { limit });
    return result;
  }
}
