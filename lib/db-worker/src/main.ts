import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { ItemIDLibID } from "@obzt/database";
import {
  BibtexGetId,
  AnnotByKeys,
  AnnotByParent,
  Attachements,
  Tags,
} from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import localforage from "localforage";
import { cache, databases, getGroupID, getLibInfo } from "./init.js";
import logger, { storageKey } from "./logger.js";
import { getItems } from "./modules/get-item.js";
import { openDb } from "./modules/init-conn.js";
import initIndex from "./modules/init-index.js";
import { attachLogger } from "./utils.js";

const methods: DbWorkerAPI = {
  getLibs: () => Object.values(getLibInfo()),
  initIndex,
  openDb,
  search: async (libraryID, options) => {
    if (!cache.items.has(libraryID)) {
      throw new Error("Query before index ready");
    }
    return await cache.search.searchAsync(options);
  },
  getTags: attachLogger(
    (items: ItemIDLibID[]) => databases.main.prepare(Tags).query(items),
    "tags",
  ),
  getItemIDsFromCitekey(citekeys) {
    const result = databases.bbt.prepare(BibtexGetId).query({ citekeys });
    return result;
  },
  getItemsFromCache: (limit, lib) => {
    const itemsCache = cache.items.get(lib);
    if (!itemsCache) {
      throw new Error("get items before cache ready");
    }
    const items = [...itemsCache.byId.values()].sort((a, b) =>
      b.dateAccessed && a.dateAccessed
        ? b.dateAccessed.getTime() - a.dateAccessed.getTime()
        : 0,
    );
    if (limit <= 0) {
      return items;
    }
    return items.slice(0, limit);
  },
  getAttachments: attachLogger(
    (docId: number, libId: number) =>
      databases.main.prepare(Attachements).query({ itemId: docId, libId }),
    (attachments, docId) =>
      `attachments of item ${docId}` +
      (attachments ? `, count: ${attachments.length}` : ""),
  ),
  getAnnotations: attachLogger(
    (attachmentId, libId) =>
      databases.main.prepare(AnnotByParent).query({
        attachmentId,
        libId,
        groupID: getGroupID(libId),
      }),
    (annots, attachmentId) =>
      `annotations of attachment ${attachmentId}` +
      (annots ? `, count: ${annots.length}` : ""),
  ),
  getAnnotFromKey: attachLogger(
    (annotKeys, libId) =>
      databases.main
        .prepare(AnnotByKeys)
        .query({ annotKeys, libId, groupID: getGroupID(libId) }),
    (annots, annotKeys) =>
      `annotations with keys: ${annotKeys.join(",")}` +
      (annots ? `, count: ${annots.length}` : ""),
  ),
  getItems,
  isUpToDate: () => databases.main.isUpToDate(),
  checkDbStatus: (name) => databases[name].opened,
  /**
   * raw query on zotero database
   */
  raw<R>(mode: "get" | "all", sql: string, args: any[]): R | R[] {
    const { instance: db } = databases.main;
    if (!db) {
      throw new Error("failed to query raw: no main database opened");
    }
    return db.prepare(sql)[mode](...args);
  },
  setLoglevel: (level) => {
    logger.level = level;
    localforage.setItem(storageKey, level);
  },
};

worker(logError(methods));
