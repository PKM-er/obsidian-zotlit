import Worker from "@aidenlx/workerpool/worker";
import { logError } from "@obzt/common";
import type { IDLibID } from "@obzt/database";
import {
  AnnotByKeys,
  AnnotByParent,
  Attachements,
  Tags,
  NoteByParent,
  NoteByKeys,
} from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/api";
import localforage from "localforage";
// import { use } from "to-use";
import { conn, index, itemFetcher } from "./globals";
import logger, { storageKey } from "./logger.js";
import { attachLogger } from "./utils/log.js";

class Main {
  #conn = conn;
  #index = index;
  #fetcher = itemFetcher;

  api: DbWorkerAPI = {
    getLibs: () => this.#conn.libraries,
    initIndex: async (libId) => {
      await this.#index.load(libId);
    },
    openDb: (...args) => {
      return this.#conn.load(...args);
    },
    search: async (libraryID, options) => {
      return await this.#index.searchItems(libraryID, options);
    },
    getItems: async (items, forceUpdate) => {
      return await this.#fetcher.get(items, forceUpdate);
    },
    getTags: attachLogger(
      (items: IDLibID[]) => this.#conn.zotero.prepare(Tags).query(items),
      "tags",
    ),
    getItemIDsFromCitekey: (citekeys) => {
      return this.#conn.getItemIDsFromCitekey(citekeys);
    },
    getItemsFromCache: (limit, lib) => {
      return this.#index.getCachedItems(limit, lib);
    },
    getAttachments: attachLogger(
      (docId: number, libId: number) =>
        this.#conn.zotero.prepare(Attachements).query({ itemId: docId, libId }),
      (attachments, docId) =>
        `attachments of item ${docId}` +
        (attachments ? `, count: ${attachments.length}` : ""),
    ),
    getAnnotations: attachLogger(
      (attachmentId, libId) =>
        this.#conn.zotero.prepare(AnnotByParent).query({
          attachmentId,
          libId,
          groupID: this.#conn.groupOf(libId),
        }),
      (annots, attachmentId) =>
        `annotations of attachment ${attachmentId}` +
        (annots ? `, count: ${annots.length}` : ""),
    ),
    getAnnotFromKey: attachLogger(
      (annotKeys, libId) =>
        this.#conn.zotero
          .prepare(AnnotByKeys)
          .query({ annotKeys, libId, groupID: this.#conn.groupOf(libId) }),
      (annots, annotKeys) =>
        `annotations with keys: ${annotKeys.join(",")}` +
        (annots ? `, count: ${annots.length}` : ""),
    ),
    getNotes: attachLogger(
      (itemID, libId) =>
        this.#conn.zotero.prepare(NoteByParent).query({
          itemID,
          libId,
          groupID: this.#conn.groupOf(libId),
        }),
      (notes, docItemId) =>
        `notes of literature ${docItemId}` +
        (notes ? `, count: ${notes.length}` : ""),
    ),
    getNoteFromKey: attachLogger(
      (noteKeys, libId) =>
        this.#conn.zotero
          .prepare(NoteByKeys)
          .query({ noteKeys, libId, groupID: this.#conn.groupOf(libId) }),
      (notes, noteKeys) =>
        `notes with keys: ${noteKeys.join(",")}` +
        (notes ? `, count: ${notes.length}` : ""),
    ),
    getRelations: attachLogger(
      (items: [number, number][]) =>
        this.#conn.getRelations(items),
      (relations, items) =>
        `relations for items: ${items.map(([id]) => id).join(",")}` +
        (relations ? `, count: ${Object.keys(relations).length}` : ""),
    ),
    isUpToDate: () => this.#conn.zotero.isUpToDate(),
    getLoadStatus: () => {
      const status = this.#conn.loadStatus;
      return {
        main: status.main,
        bbt: this.#conn.bbtLoadStatus,
        bbtVersion: status.bbtSearch === null ? "v1" : "v0",
      };
    },
    /**
     * raw query on zotero database
     */
    raw: <R>(mode: "get" | "all", sql: string, args: any[]): R | R[] => {
      const {
        zotero: { instance },
      } = this.#conn;
      if (!instance) {
        throw new Error("failed to query raw: no main database opened");
      }
      return instance.prepare(sql)[mode](...args);
    },
    setLoglevel: (level) => {
      logger.level = level;
      localforage.setItem(storageKey, level);
    },
  };

  toAPI(): DbWorkerAPI {
    return logError(this.api);
  }
}

const main = new Main();
new Worker(main.toAPI() as any);
