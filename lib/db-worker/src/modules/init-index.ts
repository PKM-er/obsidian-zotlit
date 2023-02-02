import { getItemKeyGroupID } from "@obzt/common";
import type { ItemIDLibID, ItemDetails, RegularItemInfo } from "@obzt/database";
import { ItemsFull } from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import Fuse from "fuse.js";
import { databases, cache } from "@init";
import log from "@log";
import { getItemObjects } from "./get-item";

const fuseOptions: Fuse.IFuseOptions<RegularItemInfo> = {
  keys: ["title"],
  ignoreLocation: true,
  ignoreFieldNorm: true,
  includeMatches: true,
  shouldSort: true,
};

const initIndex: DbWorkerAPI["initIndex"] = (libraryID) => {
  log.debug("Reading main Zotero database for index");

  const itemsResult = databases.main
    .prepare(ItemsFull)
    .query({ libId: libraryID });
  const itemIDMap = itemsResult.reduce(
    (rec, item) => ((rec[item.itemID] = item), rec),
    {} as Record<number, ItemDetails>,
  );
  const itemIDs = Object.keys(itemIDMap).map(
    (itemID) => [Number(itemID), libraryID] as ItemIDLibID,
  );

  const items = getItemObjects(itemIDMap, itemIDs);
  log.info("Finished reading main Zotero database for index");

  log.trace("Start fuse indexing");
  const regularItems = Object.values(items);
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
