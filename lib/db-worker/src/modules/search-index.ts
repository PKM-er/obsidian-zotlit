import { getItemKeyGroupID } from "@obzt/common";
import { Items, ItemsByKey, ItemsFull } from "@obzt/database";
import type {
  IDLibID,
  ItemDetails,
  KeyLibID,
  RegularItemInfo,
} from "@obzt/database";
import type { DocumentSearchOptions } from "flexsearch";
import Document from "flexsearch/src/document";
import language from "flexsearch/src/lang/en.js";
import charset from "flexsearch/src/lang/latin/default.js";
// import { use } from "to-use";
import log from "@log";
import { conn } from "../globals";
import type { Deferred } from "../utils/deferred";
import { deferred } from "../utils/deferred";
import ItemBuilder from "./item-builder";

export default class SearchIndex {
  #conn = conn;
  #itemBuilder = new ItemBuilder();

  #search = new Document<RegularItemInfo, true>({
    worker: true,
    charset,
    language,
    document: {
      id: "itemID",
      index: ["title", "creators[]:firstName", "creators[]:lastName", "date"],
    },
    tokenize: "full",
    // @ts-ignore
    suggest: true,
  });

  #itemsCache = new Map<
    number,
    {
      byKey: Map<string, RegularItemInfo>;
      byId: Map<number, RegularItemInfo>;
    }
  >();

  #status = new Map<number, SearchIndexStatus>();

  getStatus(libraryID: number): Promise<void> | "ERROR" | "READY" {
    if (!this.#status.has(libraryID)) {
      const defer = deferred<void>();
      this.#status.set(libraryID, defer);
      return defer.promise;
    }
    const status = this.#status.get(libraryID);
    if (status instanceof Promise || typeof status === "string") {
      return status;
    }
    return status!.promise;
  }

  load(libraryID: number): Promise<void> {
    const currentStatus = this.#status.get(libraryID);
    if (currentStatus instanceof Promise) {
      return currentStatus;
    }
    const items = this.#readAllItems(libraryID);
    const promise = this.#fullUpdateIndex(libraryID, items)
      .then(() => {
        this.#status.set(libraryID, "READY");
      })
      .catch((err) => {
        this.#status.set(libraryID, "ERROR");
        throw err;
      });
    // resolve previous promise if any
    if (!(typeof currentStatus === "string" || !currentStatus)) {
      promise.then(currentStatus.resolve, currentStatus.reject);
    }
    this.#status.set(libraryID, promise);
    return promise;
  }

  async searchItems(
    libraryID: number,
    options: Partial<DocumentSearchOptions<false>>,
  ) {
    await this.#checkStatus(libraryID);
    const result = await this.#search.searchAsync(options);
    return result;
  }

  /**
   * Retrieves cached items from the cache for a given library ID.
   * @param limit - The maximum number of items to retrieve.
   * @param libraryID - The ID of the library to retrieve cached items for.
   * @returns An array of cached items, sorted by date accessed in descending order.
   * @throws An error if the cache for the given library ID is not initialized.
   */
  async getCachedItems(limit: number, libraryID: number) {
    await this.#checkStatus(libraryID);
    const cache = this.#itemsCache.get(libraryID);
    if (!cache) {
      throw new Error("Cache not initialized");
    }
    const items = [...cache.byId.values()].sort((a, b) =>
      b.dateAccessed && a.dateAccessed
        ? b.dateAccessed.getTime() - a.dateAccessed.getTime()
        : 0,
    );
    if (limit <= 0) {
      return items;
    }
    return items.slice(0, limit);
  }

  async getItemsCache(libraryID: number) {
    await this.#checkStatus(libraryID);
    const cache = this.#itemsCache.get(libraryID);
    if (!cache) {
      throw new Error("Cache not initialized");
    }
    return cache;
  }

  async #checkStatus(libraryID: number) {
    const status = this.getStatus(libraryID);
    if (status === "ERROR") {
      throw new Error("Indexing failed");
    }
    if (status instanceof Promise) {
      await status;
    }
  }

  #readAllItems(libraryID: number) {
    log.debug("Reading main Zotero database for index");
    const { zotero } = this.#conn;
    const items = this.#toItemObjects(
      zotero.prepare(ItemsFull).query({ libId: libraryID }),
    );
    log.info("Finished reading main Zotero database for index");
    return items;
  }
  readItemByKey(keys: KeyLibID[]): Record<number, RegularItemInfo> {
    const { zotero } = this.#conn;
    const itemKeyMap = zotero.prepare(ItemsByKey).query(keys);

    const items = this.#toItemObjects(keys.map(([key]) => itemKeyMap[key]));
    return items;
  }
  readItemById(ids: IDLibID[]): Record<number, RegularItemInfo> {
    const { zotero } = this.#conn;
    const itemIDMap = zotero.prepare(Items).query(ids);
    const items = this.#toItemObjects(ids.map(([id]) => itemIDMap[id]));
    return items;
  }

  #toItemObjects(items: ItemDetails[]) {
    const itemIDMap = items.reduce(
      (rec, item) => ((rec[item.itemID] = item), rec),
      {} as Record<number, ItemDetails>,
    );
    const itemIDLibs = items.map(
      (item) => [item.itemID, item.libraryID] as IDLibID,
    );

    return this.#itemBuilder.toItemObjects(itemIDMap, itemIDLibs);
  }

  /**
   * update the index and item cache for a library
   * NOTE: cache for whole library is wiped and re-indexed
   */
  async #fullUpdateIndex(
    libraryID: number,
    items: Record<number, RegularItemInfo>,
  ) {
    log.trace("Start flexsearch indexing");

    const regularItems = Object.values(items);

    const prev = this.#itemsCache.get(libraryID);
    this.#itemsCache.set(libraryID, {
      byId: new Map(regularItems.map((i) => [i.itemID, i])),
      byKey: new Map(regularItems.map((i) => [getItemKeyGroupID(i, true), i])),
    });
    if (!prev) {
      await Promise.all([
        ...regularItems.map((i) => this.#search.addAsync(i.itemID, i)),
      ]);
    } else {
      const itemIDSet = new Set(regularItems.map((i) => i.itemID));
      const toRemove = [...prev.byId.keys()].filter((id) => !itemIDSet.has(id));
      prev.byId.clear();
      prev.byKey.clear();
      await Promise.all([
        ...regularItems.map((i) => this.#search.addAsync(i.itemID, i)),
        ...toRemove.map((id) => this.#search.removeAsync(id)),
      ]);
    }
    log.info("Library citation index done: " + libraryID);
  }

  /**
   * partial update the index and item cache for items in a library
   */
  async updateIndex(items: Record<number, RegularItemInfo>) {
    await Promise.all(
      Object.values(items).map(async (item) => {
        const cache = this.#itemsCache.get(item.libraryID);
        if (!cache) {
          throw new Error("Cannot update index for library not initialized");
        }
        cache.byId.set(item.itemID, item);
        cache.byKey.set(getItemKeyGroupID(item, true), item);
        await this.#search.updateAsync(item.itemID, item);
      }),
    );
  }
}

type SearchIndexStatus = Deferred<void> | "ERROR" | "READY" | Promise<void>;
