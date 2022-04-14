import log from "@log";
import { getItemKeyGroupID, multipartToSQL } from "@utils";
import type { RegularItem } from "@zt-types";
import Fuse from "fuse.js";

import betterBibTexSql from "./better-bibtex.sql";
import creatorsSql from "./creators.sql";
import generalSql from "./general.sql";

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title"],
  ignoreLocation: true,
  ignoreFieldNorm: true,
  includeMatches: true,
  shouldSort: true,
};

export const registerInitIndex = () => {
  Comms.handle("cb:initIndex", async (libraryID, refresh = false) => {
    if (refresh) {
      await Promise.all([
        Databases.main.refreshDatabase(),
        Databases.bbt.refreshDatabase(),
      ]);
    }

    const { general, creators } = readMainDb(libraryID);
    const citekeyMap = readBbtDb();

    // prepare for fuse index
    let entries = {} as any;
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

    log.info("start indexing for fuse");
    const items = Object.values(entries) as RegularItem[];

    Index[libraryID] = new Fuse(items, fuseOptions);
    log.info("fuse initialized");

    return [[]];

    // const itemMap = items.reduce(
    //   (record, item) => ((record[getItemKeyGroupID(item)] = item), record),
    //   {} as Record<string, RegularItem>,
    // );
    // return [[itemMap]];
  });
};

const readMainDb = (libraryID: number) => {
  log.info("Reading main Zotero database for index");
  const db = Databases.main.db;
  if (!db) {
    throw new Error("failed to init index: no main database opened");
  }
  const result = {
    general: db.prepare(generalSql).all(libraryID),
    creators: db.prepare(creatorsSql).all(libraryID),
  };
  log.info("Reading main Zotero database for index done");
  return result;
};
const readBbtDb = () => {
  log.info("Reading Better BibTex database");
  const db = Databases.bbt.db;
  if (!db) {
    log.info("no Better BibTex database opened, using empty array");
    return [];
  } else {
    const result = db.prepare(betterBibTexSql).all();
    log.info("Reading Better BibTex done");
    return result;
  }
};
