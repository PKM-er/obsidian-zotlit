import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";
import { whereID, checkID, nonRegularItemTypes } from "../../utils/index.js";

const selectFrom = `--sql
SELECT
  items.libraryID,
  items.itemID,
  items.key,
  items.clientDateModified,
  items.dateAdded,
  items.dateModified,
  itemTypesCombined.typeName as itemType,
  collectionItems.collectionID
FROM 
  items
  JOIN itemTypesCombined USING (itemTypeID)
  LEFT JOIN collectionItems USING (itemID)
`;

export const sql = (by: "key" | "id" | "full") => `--sql
${selectFrom}
WHERE 
  libraryID = $libId
  ${
    by === "full"
      ? whereID(false)
      : by === "id"
      ? whereID("items.itemID")
      : whereID("items.key", "$key")
  }
  AND ${checkID()}
  AND itemType NOT IN (${nonRegularItemTypes})
`;

export interface Output {
  libraryID: DB.Items["libraryID"];
  itemID: ItemIDChecked;
  key: DB.Items["key"];
  itemType: DB.ItemTypesCombined["typeName"];
  clientDateModified: DB.Items["clientDateModified"];
  dateAdded: DB.Items["dateAdded"];
  dateModified: DB.Items["dateModified"];
  collectionID: DB.CollectionItems["collectionID"] | null;
}
