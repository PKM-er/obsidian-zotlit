import { getItemKeyGroupID, multipartToSQL } from "@obzt/common";
import type { GeneralItem, GeneralItemBase } from "@obzt/zotero-type";
import Fuse from "fuse.js";
import type { DbWorkerAPI } from "@api";
import { databases, cache } from "@init";
import log from "@log";
import { Items, ItemFields, Creators, BetterBibtex } from "@query/sql";

const fuseOptions: Fuse.IFuseOptions<GeneralItem> = {
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
  const citekeyMap = readBbtDb();

  // prepare for fuse index
  const entries = items.reduce((rec, { itemID, ...props }) => {
    if (itemID) {
      const item: GeneralItemBase = {
        ...props,
        libraryID,
        groupID: libInfo[libraryID].groupID,
        itemID,
        creators: [],
        citekey: null,
      };
      rec[itemID] = item as GeneralItem;
    }
    return rec;
  }, {} as Record<number, GeneralItem>);

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
      console.error(
        `Field: No item found for itemID ${itemID}`,
        fieldName,
        value,
      );
    }
  }
  for (const { itemID, ...creator } of creators) {
    if (itemID in entries) {
      entries[itemID].creators.push(creator);
    } else {
      console.error(`Creator: No item found for itemID ${itemID}`, creator);
    }
  }
  for (const { itemID, citekey } of citekeyMap) {
    if (itemID in entries) {
      entries[itemID].citekey = citekey;
    } else {
      console.error(`Citekey: No item found for itemID ${itemID}`, citekey);
    }
  }

  log.trace("Start fuse indexing");
  const generalItems = Object.values(entries);

  cache.items.set(libraryID, {
    fuse: new Fuse(generalItems, fuseOptions),
    byKey: generalItems.reduce(
      (record, item) => (
        (record[getItemKeyGroupID(item, true)] = item), record
      ),
      {} as Record<string, GeneralItem>,
    ),
    byId: generalItems.reduce(
      (record, item) => (
        item.itemID !== null && (record[item.itemID] = item), record
      ),
      {} as Record<string, GeneralItem>,
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
const readBbtDb = () => {
  log.debug("Reading Better BibTex database");
  if (!databases.bbt.opened) {
    log.info("Better BibTex database not enabled, skipping...");
    return [];
  }
  const result = databases.bbt.prepare(BetterBibtex).query();
  log.info("Finished reading Better BibTex");
  return result;
};
