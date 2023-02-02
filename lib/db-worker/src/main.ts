import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { ItemIDLibID } from "@obzt/database";
import { AnnotByKeys, AnnotByParent, Attachements, Tags } from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import localforage from "localforage";
import { databases, getGroupID, getLibInfo } from "./init.js";
import logger, { storageKey } from "./logger.js";
import { getItems } from "./modules/get-item.js";
import { openDb } from "./modules/init-conn.js";
import initIndex from "./modules/init-index.js";
import query from "./modules/search.js";
import { attachLogger } from "./utils.js";

const methods: DbWorkerAPI = {
  getLibs: () => Object.values(getLibInfo()),
  initIndex,
  openDb,
  query,
  getTags: attachLogger(
    (items: ItemIDLibID[]) => databases.main.prepare(Tags).query(items),
    "tags",
  ),
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
