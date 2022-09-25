import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

import libsSql from "./libraries.js";

const getLibs: DbWorkerAPI["getLibs"] = async () => {
  const db = databases.main.db;
  if (!db) {
    throw new Error("failed to get libs: no main database opened");
  }
  log.info("Reading Zotero database for libraries");
  const libs: { libraryID: number; name: string }[] = await libsSql(db);
  log.info("Reading Zotero database for libraries done");
  return libs;
};
export default getLibs;
