import { getItemKeyGroupID, multipartToSQL } from "@obzt/common";
import type { RegularItemInfo, RegularItemInfoBase } from "@obzt/database";
import { Items, ItemFields, Creators, BetterBibtex } from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import Fuse from "fuse.js";
import { databases, cache } from "@init";
import log from "@log";

const fuseOptions: Fuse.IFuseOptions<RegularItemInfo> = {
  keys: ["title"],
  ignoreLocation: true,
  ignoreFieldNorm: true,
  includeMatches: true,
  shouldSort: true,
};

const initIndex: DbWorkerAPI["initIndex"] = (libraryID) => {
  if (!cache.libraries) throw new Error("Library info not loaded");
  const libInfo = cache.libraries;

  const { items, itemFields, creators } = readMainDb(libraryID);
  const citekeyMap = readCitekeys(
    libraryID,
    items.map((v) => v.itemID),
  );

  // prepare for fuse index
  const entries = items.reduce((rec, { itemID, ...props }) => {
    if (itemID) {
      const citekey = citekeyMap[itemID];
      if (!citekey) {
        log.warn(`Citekey: No item found for itemID ${itemID}`, citekey);
      }
      const item: RegularItemInfoBase = {
        ...props,
        libraryID,
        groupID: libInfo[libraryID].groupID,
        itemID,
        creators: [],
        citekey: citekeyMap[itemID],
      };
      rec[itemID] = item as RegularItemInfo;
    }
    return rec;
  }, {} as Record<number, RegularItemInfo>);

  // eslint-disable-next-line prefer-const
  for (let { itemID, fieldName, value } of itemFields) {
    if (!itemID || !fieldName) continue;
    if (fieldName === "date")
      value = multipartToSQL(value as string).split("-")[0];
    if (itemID in entries) {
      const values = (entries[itemID][fieldName] =
        entries[itemID][fieldName] || []);
      values.push(value);
    } else {
      log.error(`Field: No item found for itemID ${itemID}`, fieldName, value);
    }
  }
  for (const { itemID, ...creator } of creators) {
    if (itemID in entries) {
      entries[itemID].creators.push(creator);
    } else {
      log.error(`Creator: No item found for itemID ${itemID}`, creator);
    }
  }

  log.trace("Start fuse indexing");
  const regularItems = Object.values(entries);

  cache.items.set(libraryID, {
    fuse: new Fuse(regularItems, fuseOptions),
    byKey: regularItems.reduce(
      (record, item) => (
        (record[getItemKeyGroupID(item, true)] = item), record
      ),
      {} as Record<string, RegularItemInfo>,
    ),
    byId: regularItems.reduce(
      (record, item) => (
        item.itemID !== null && (record[item.itemID] = item), record
      ),
      {} as Record<string, RegularItemInfo>,
    ),
  });
  log.info("Library citation index initialized");
};

export default initIndex;

const readMainDb = (libId: number) => {
  log.debug("Reading main Zotero database for index");
  const db = databases.main;
  const result = {
    items: db.prepare(Items).query({ libId }),
    itemFields: db.prepare(ItemFields).query({ libId }),
    creators: db.prepare(Creators).query({ libId }),
  };
  log.info("Finished reading main Zotero database for index");
  return result;
};
const readCitekeys = (libId: number, itemIDs: number[]) => {
  log.debug("Reading Better BibTex database");
  if (!databases.bbt.opened) {
    log.info("Better BibTex database not enabled, skipping...");
    return [];
  }
  const result = databases.bbt.prepare(BetterBibtex).query({ libId, itemIDs });
  log.info("Finished reading Better BibTex");
  return result;
};
