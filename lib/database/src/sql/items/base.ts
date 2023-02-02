import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";
import {
  whereItemID,
  checkItemID,
  nonRegularItemTypes,
} from "../../utils/index.js";

export const sql = (full: boolean) => `--sql
SELECT
  items.itemID,
  items.key,
  itemTypesCombined.typeName as itemType
FROM 
  items
  JOIN itemTypesCombined USING (itemTypeID)
WHERE 
  libraryID = $libId
  ${whereItemID(full || "items.itemID")}
  AND ${checkItemID()}
  AND itemType NOT IN (${nonRegularItemTypes})
`;

export const sqlByKey = `--sql
SELECT
  items.itemID,
  items.key,
  itemTypesCombined.typeName as itemType
FROM 
  items
  JOIN itemTypesCombined USING (itemTypeID)
WHERE 
  libraryID = $libId
  AND items.key = $key
  AND ${checkItemID()}
  AND itemType NOT IN (${nonRegularItemTypes})
`;

export interface Output {
  itemID: ItemIDChecked;
  key: DB.Items["key"];
  itemType: DB.ItemTypesCombined["typeName"];
}
