import Worker from "@aidenlx/workerpool/worker";
import { logError } from "@obzt/common";
import type { IDLibID } from "@obzt/database";
import {
  BibtexGetId,
  AnnotByKeys,
  AnnotByParent,
  Attachements,
  Tags,
  NoteByParent,
  NoteByKeys,
} from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/api";
import localforage from "localforage";
import { cache, databases, getGroupID, getLibInfo } from "./init.js";
import logger, { storageKey } from "./logger.js";
import { getItems } from "./modules/get-item.js";
import { openDb } from "./modules/init-conn.js";
import initIndex from "./modules/init-index.js";
import { attachLogger } from "./utils.js";

new Worker(
  logError({
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
      (items: IDLibID[]) => databases.main.prepare(Tags).query(items),
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
    getNotes: attachLogger(
      (itemID, libId) =>
        databases.main.prepare(NoteByParent).query({
          itemID,
          libId,
          groupID: getGroupID(libId),
        }),
      (notes, docItemId) =>
        `notes of literature ${docItemId}` +
        (notes ? `, count: ${notes.length}` : ""),
    ),
    getNoteFromKey: attachLogger(
      (noteKeys, libId) =>
        databases.main
          .prepare(NoteByKeys)
          .query({ noteKeys, libId, groupID: getGroupID(libId) }),
      (notes, noteKeys) =>
        `notes with keys: ${noteKeys.join(",")}` +
        (notes ? `, count: ${notes.length}` : ""),
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
  } satisfies DbWorkerAPI),
);
