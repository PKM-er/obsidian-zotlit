import { worker } from "workerpool";
import type { DbWorkerAPI } from "./api.js";
import { databases } from "./init.js";
import logger from "./logger.js";
import getAnnotations from "./modules/annotation/index.js";
import getAttachments from "./modules/attachments/index.js";
import getItem from "./modules/get-item.js";
import getLibs from "./modules/get-libs/index.js";
import initIndex from "./modules/init-index/index.js";
import openDb from "./modules/open-db.js";
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
  refreshDatabases: async () => {
    await databases.main.refresh();
    await databases.bbt?.refresh();
  },
  setLoglevel: (level) => {
    logger.level = level;
  },
};

worker(methods as never);
