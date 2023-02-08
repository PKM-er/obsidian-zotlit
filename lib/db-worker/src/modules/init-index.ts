import { getItemKeyGroupID } from "@obzt/common";
import type { ItemIDLibID, ItemDetails } from "@obzt/database";
import { ItemsFull } from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import { databases, cache } from "@init";
import log from "@log";
import { getItemObjects } from "./get-item";

const initIndex: DbWorkerAPI["initIndex"] = async (libraryID) => {
  log.debug("Reading main Zotero database for index");

  const itemsResult = databases.main
    .prepare(ItemsFull)
    .query({ libId: libraryID });
  const itemIDMap = itemsResult.reduce(
    (rec, item) => ((rec[item.itemID] = item), rec),
    {} as Record<number, ItemDetails>,
  );
  const itemIDLibs = Object.keys(itemIDMap).map(
    (itemID) => [Number(itemID), libraryID] as ItemIDLibID,
  );

  const items = getItemObjects(itemIDMap, itemIDLibs);
  log.info("Finished reading main Zotero database for index");

  log.trace("Start fuse indexing");

  const regularItems = Object.values(items);

  const itemIDs = regularItems.map((i) => i.itemID),
    itemIDSet = new Set(itemIDs);

  const prev = cache.items.get(libraryID);
  cache.items.set(libraryID, {
    byId: new Map(regularItems.map((i) => [i.itemID, i])),
    byKey: new Map(regularItems.map((i) => [getItemKeyGroupID(i, true), i])),
  });
  if (!prev) {
    await Promise.all([
      ...regularItems.map((i) => cache.search.addAsync(i.itemID, i)),
    ]);
  } else {
    const toRemove = [...prev.byId.keys()].filter((id) => !itemIDSet.has(id));
    prev.byId.clear();
    prev.byKey.clear();
    await Promise.all([
      ...regularItems.map((i) => cache.search.addAsync(i.itemID, i)),
      ...toRemove.map((id) => cache.search.removeAsync(id)),
    ]);
  }

  log.info("Library citation index initialized");
};

export default initIndex;
