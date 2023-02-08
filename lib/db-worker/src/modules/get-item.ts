import { getItemKeyGroupID, multipartToSQL } from "@obzt/common";

import type {
  ItemDetails,
  ItemIDLibID,
  RegularItemInfo,
  RegularItemInfoBase,
} from "@obzt/database";
import {
  Items,
  ItemsByKey,
  BetterBibtex,
  Creators,
  ItemFields,
} from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import type { ItemKeyLibID } from "@obzt/database/dist/utils";
import { assertNever } from "assert-never";
import { cache, databases } from "@init";
import log from "@log";

const getItemFromCache = (
  item: string | number,
  libId: number,
): RegularItemInfo | null => {
  let result;
  if (typeof item === "number") {
    const idIndex = cache.items.get(libId)?.byId;
    if (!idIndex) throw new Error("get item by id before cache ready");
    result = idIndex.get(item);
  } else if (typeof item === "string") {
    const keyIndex = cache.items.get(libId)?.byKey;
    if (!keyIndex) throw new Error("get item by key before cache ready");
    result = keyIndex.get(item);
  } else assertNever(item);
  return result ?? null;
};

const readCitekeys = (items: ItemIDLibID[]) => {
  log.debug("Reading Better BibTex database");
  if (!databases.bbt.opened) {
    log.info("Better BibTex database not enabled, skipping...");
    return [];
  }
  const result = databases.bbt.prepare(BetterBibtex).query({ items });
  log.info("Finished reading Better BibTex");
  return result;
};

export function getItemObjects(
  itemIDMap: Record<number, ItemDetails>,
  itemIDs: ItemIDLibID[],
): Record<number, RegularItemInfo> {
  if (!cache.libraries) throw new Error("Library info not loaded");
  const libInfo = cache.libraries;

  const citekeyMap = readCitekeys(itemIDs);

  const itemFields = databases.main.prepare(ItemFields).query(itemIDs),
    creators = databases.main.prepare(Creators).query(itemIDs);

  return itemIDs.reduce((rec, [itemID, libraryID]) => {
    if (!itemID) return rec;
    const citekey = citekeyMap[itemID];
    if (!citekey) {
      log.warn(`Citekey: No item found for itemID ${itemID}`, citekey);
    }
    const itemObject: RegularItemInfoBase = {
      ...itemIDMap[itemID],
      libraryID,
      groupID: libInfo[libraryID].groupID,
      itemID,
      creators: creators[itemID],
      citekey: citekeyMap[itemID],
      ...itemFields[itemID].reduce((fields, field) => {
        let { value } = field;
        if (field.fieldName === "date") {
          value = multipartToSQL(value as string).split("-")[0];
        }
        (fields[field.fieldName] ??= []).push(value);
        return fields;
      }, {} as Record<string, unknown[]>),
    };
    rec[itemID] = itemObject as RegularItemInfo;
    return rec;
  }, {} as Record<number, RegularItemInfo>);
}

const isItemKeys = (
  items: ItemIDLibID[] | ItemKeyLibID[],
): items is ItemKeyLibID[] => typeof items[0][0] === "string";
export const getItems: DbWorkerAPI["getItems"] = (items, forceUpdate) => {
  if (items.length === 0) return [];
  if (!forceUpdate) {
    return items.map(([keyOrID, libId]) => getItemFromCache(keyOrID, libId));
  }

  let itemIDMap: Record<number, ItemDetails>,
    itemIDs: ItemIDLibID[],
    itemIDObjectMap: Record<number, RegularItemInfo>;
  if (isItemKeys(items)) {
    const itemKeyMap = databases.main.prepare(ItemsByKey).query(items);
    itemIDs = items.map(
      ([key, libId]) => [itemKeyMap[key].itemID, libId] as ItemIDLibID,
    );
    itemIDMap = itemIDs.reduce((rec, [itemID], index) => {
      const [key] = items[index];
      rec[itemID] = itemKeyMap[key];
      return rec;
    }, {} as Record<number, ItemDetails>);
    itemIDObjectMap = getItemObjects(itemIDMap, itemIDs);
    updateCache(itemIDObjectMap);
    return items.map(([key]) => itemIDObjectMap[itemKeyMap[key].itemID]);
  } else {
    itemIDs = items;
    itemIDMap = databases.main.prepare(Items).query(itemIDs);
    itemIDObjectMap = getItemObjects(itemIDMap, itemIDs);
    updateCache(itemIDObjectMap);
    return items.map(([itemID]) => itemIDObjectMap[itemID]);
  }
};

function updateCache(itemIDObjectMap: Record<number, RegularItemInfo>) {
  for (const item of Object.values(itemIDObjectMap)) {
    const cacheForLib = cache.items.get(item.libraryID);
    if (!cacheForLib) throw new Error("Cache not initialized");
    cacheForLib.byId.set(item.itemID, item);
    cacheForLib.byKey.set(getItemKeyGroupID(item, true), item);
  }
}
