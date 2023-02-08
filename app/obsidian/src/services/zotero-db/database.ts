import type { RegularItemInfo } from "@/../../../lib/database/dist";
import { Service } from "@ophidian/core";
import DatabaseWatcher from "./auto-refresh/service";
import DatabaseWorker, { DatabaseStatus } from "./connector/service";
import { DatabaseSettings } from "./connector/settings";
import log from "@/log";

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
    query: string,
    matchField: string,
    limit = 20,
    lib = this.defaultLibId,
  ) {
    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const raw = await this.api.search(lib, { query, limit, index: matchField });
    if (raw.length === 0) return [];
    const [{ result }] = raw;
    if (result.length === 0) return [];
    const items = (await this.api.getItems(
      result.map((i) => [Number(i), lib]),
    )) as RegularItemInfo[];
    return items;
  }
  async getItemsOf(limit = 20, lib = this.defaultLibId) {
    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const result = await this.api.getItemsFromCache(limit, lib);
    return result;
  }
}
