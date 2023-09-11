import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";
import { whereID, checkID, nonRegularItemTypes } from "../../utils/index.js";

export const sql = (by: "key" | "id" | "full") => `--sql
SELECT
  items.libraryID,
  items.itemID,
  items.key,
  items.clientDateModified,
  items.dateAdded,
  items.dateModified,
  itemTypesCombined.typeName as itemType,
  json_group_array(collectionID) filter (where collectionID is not null) as collectionIDs
FROM 
  items
  JOIN itemTypesCombined USING (itemTypeID)
  LEFT JOIN collectionItems USING (itemID)
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
GROUP BY itemID
`;

export interface OutputSql {
  libraryID: DB.Items["libraryID"];
  itemID: ItemIDChecked;
  key: DB.Items["key"];
  itemType: DB.ItemTypesCombined["typeName"];
  clientDateModified: DB.Items["clientDateModified"];
  dateAdded: DB.Items["dateAdded"];
  dateModified: DB.Items["dateModified"];
  collectionIDs: string;
}

export type Output = Omit<OutputSql, "collectionIDs"> & {
  collectionIDs: number[];
};
