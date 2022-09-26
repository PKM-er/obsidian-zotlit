import { worker } from "workerpool";
import type { DbWorkerAPI } from "./api.js";
import logger from "./logger.js";
import getLibs from "./modules/get-libs/index.js";
import initIndex from "./modules/init-index/index.js";
import openDb from "./modules/open-db.js";
import query from "./modules/query.js";

const methods: DbWorkerAPI = {
  getLibs,
  initIndex,
  openDb,
  query,
  setLoglevel: (level) => {
    logger.level = level;
  },
};

worker(methods as never);
