import { multipartToSQL } from "@obzt/common";
import type { RegularItem } from "@obzt/zotero-type";
import Fuse from "fuse.js";
import type { DbWorkerAPI } from "@api";
import { databases, index } from "@init";
import log from "@log";

import betterBibTexSql from "./better-bibtex.js";
import creatorsSql from "./creators.js";
import generalSql from "./general.js";

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title"],
  ignoreLocation: true,
  ignoreFieldNorm: true,
  includeMatches: true,
  shouldSort: true,
};

const initIndex: DbWorkerAPI["initIndex"] = async (
  libraryID,
  refresh = false,
) => {
  if (refresh) {
    await Promise.all([databases.main.refresh(), databases.bbt?.refresh()]);
  }

  const { general, creators } = await readMainDb(libraryID);
  const citekeyMap = await readBbtDb();

  // prepare for fuse index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = {} as any;
  // eslint-disable-next-line prefer-const
  for (let { itemID, fieldName, value, ...props } of general) {
    if (fieldName === "date") value = multipartToSQL(value).split("-")[0];
    if (itemID in entries) {
      entries[itemID][fieldName] = value;
    } else {
      entries[itemID] = {
        itemID,
        ...props,
        [fieldName]: value,
        creators: [],
      };
    }
  }
  for (const { itemID, ...creator } of creators) {
    entries[itemID]?.creators.push(creator);
  }
  for (const { itemID, citekey } of citekeyMap) {
    entries[itemID] && (entries[itemID].citekey = citekey);
  }

  log.trace("Start fuse indexing");
  const items = Object.values(entries) as RegularItem[];

  index[libraryID] = new Fuse(items, fuseOptions);
  log.info("Library index initialized");

  // const itemMap = items.reduce(
  //   (record, item) => ((record[getItemKeyGroupID(item)] = item), record),
  //   {} as Record<string, RegularItem>,
  // );
  // return [[itemMap]];
};

export default initIndex;

const readMainDb = async (libraryID: number) => {
  log.debug("Reading main Zotero database for index");
  const db = databases.main.db;
  if (!db) {
    throw new Error("failed to init index: no main database opened");
  }
  const result = {
    general: await generalSql(db, libraryID),
    creators: await creatorsSql(db, libraryID),
  };
  log.info("Finished reading main Zotero database for index");
  return result;
};
const readBbtDb = async () => {
  log.debug("Reading Better BibTex database");
  if (!databases.bbt) {
    log.info("Better BibTex database not enabled, skipping...");
    return [];
  }
  const db = databases.bbt.db;
  if (!db) {
    throw new Error("failed to init index: no Better BibTex database opened");
  }
  const result = await betterBibTexSql(db);
  log.info("Finished reading Better BibTex");
  return result;
};
