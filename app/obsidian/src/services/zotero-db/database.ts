import type { RegularItemInfo } from "@/../../../lib/database/dist";
import type { SimpleDocumentSearchResultSetUnit } from "@obzt/database/api";
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

  async search(query: string): Promise<SearchResult[]> {
    const limit = 50,
      lib = this.defaultLibId;

    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const result = await this.api.search(lib, {
      query,
      limit,
      index: matchFields,
    });
    if (result.length === 0) return [];
    const sorted = sort(result);
    if (sorted.length === 0) return [];
    const items = await this.api.getItems(sorted.map((i) => [i.id, lib]));

    return items.map((item, index) => {
      const { id, fields, score } = sorted[index];
      if (!item) throw new Error("Item not found: " + id);
      return { item, score, fields: [...fields] };
    });
  }
  async getItemsOf(
    limit = 50,
    lib = this.defaultLibId,
  ): Promise<SearchResult[]> {
    if (this.#worker.status !== DatabaseStatus.Ready)
      throw new Error("Search index not ready");
    const result = await this.api.getItemsFromCache(limit, lib);
    return result.map((item) => ({ item, score: -1, fields: [] }));
  }
}

interface SearchResultRaw {
  id: number;
  score: number;
  fields: Set<string>;
}

export interface SearchResult {
  item: RegularItemInfo;
  score: number;
  fields: string[];
}

const matchFields: string[] = [
  "title",
  "creators[]:firstName",
  "creators[]:lastName",
  "date",
];

function sort(resultSet: SimpleDocumentSearchResultSetUnit[]) {
  const { size } = new Set(resultSet.flatMap((r) => r.result));
  const items = resultSet.reduce((idScore, { field, result }) => {
    if (field.startsWith("creators[]")) {
      field = "creators";
    }
    result.forEach((id, index) => {
      let score = size - index;
      switch (field) {
        case "title":
          score *= 100;
          break;
        case "creators":
        case "date":
          score *= 5;
          break;
        default:
          throw new Error("Unknown field: " + field);
      }

      if (!idScore.has(+id)) {
        idScore.set(+id, { id: +id, score, fields: new Set([field]) });
      } else {
        const scoreObj = idScore.get(+id)!;
        scoreObj.fields.add(field);
        scoreObj.score += score;
      }
    });
    return idScore;
  }, new Map<number, SearchResultRaw>());
  return Array.from(items.values()).sort((a, b) => b.score - a.score);
}
