import { worker } from "workerpool";
import type { DbWorkerAPI } from "./api.js";
import { databases } from "./init.js";
import logger from "./logger.js";
import getAnnotations from "./modules/annotation/index.js";
import getAttachments from "./modules/attachments/index.js";
import getItem from "./modules/get-item.js";
import getLibs from "./modules/get-libs/index.js";
import { openDb, refreshDb } from "./modules/init-conn.js";
import initIndex from "./modules/init-index/index.js";
import query from "./modules/query.js";
import getTags from "./modules/tags/index.js";

const methods: DbWorkerAPI = {
  getLibs,
  initIndex,
  openDb,
  query,
  getTags,
  getAttachments,
  getAnnotations,
  getItem,
  refreshDb,
  /**
   * raw query on zotero database
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: async <R>(sql: string, args: any[]) => {
    const { db } = databases.main;
    if (!db) {
      throw new Error("failed to query raw: no main database opened");
    }
    const result = await db.raw(sql, ...args);
    return result as R;
  },
  setLoglevel: (level) => {
    logger.level = level;
  },
};

worker(methods as never);
