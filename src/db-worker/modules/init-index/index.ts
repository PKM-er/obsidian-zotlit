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
  Comms.handle("cb:initIndex", async (libraryID) => {
    if (!Databases.main || !Databases.bbt) {
      return "failed to init index: database not initialized";
    }
    const [main, bbt] = await Promise.allSettled([
      readMainDb(libraryID),
      readBbtDb(),
    ]);
    if (main.status !== "fulfilled") {
      log.error(main.reason);
      return main.reason;
    }
    const { general, creators } = main.value;
    let citekeyMap: any[];
    if (bbt.status === "fulfilled") {
      citekeyMap = bbt.value.citekeyMap;
    } else {
      citekeyMap = [];
      log.warn("failed to get better bibtex data: ", bbt.reason);
    }

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

    const itemMap = items.reduce(
      (record, item) => ((record[getItemKeyGroupID(item)] = item), record),
      {} as Record<string, RegularItem>,
    );
    return [[itemMap]];
  });
};

const readMainDb = async (libraryID: number) => {
  log.info("Reading main Zotero database for index");

  if (!Databases.main) {
    throw new Error("no main database inited");
  }
  await Databases.main.open();
  const result = {
    general: await Databases.main.read((db) =>
      db.prepare(generalSql).all(libraryID),
    ),
    creators: await Databases.main.read((db) =>
      db.prepare(creatorsSql).all(libraryID),
    ),
  };
  log.info("Reading main Zotero database for index done");
  return result;
};
const readBbtDb = async () => {
  log.info("Reading Better BibTex database");
  if (!Databases.bbt) {
    throw new Error("no Better BibTex database inited");
  }
  await Databases.bbt.open();
  const result = {
    citekeyMap: await Databases.bbt.read((db) =>
      db.prepare(betterBibTexSql).all(),
    ),
    mode: Databases.bbt.mode,
  };
  log.info("Reading Better BibTex done");
  return result;
};
