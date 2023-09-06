import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";
import {
  whereID,
  checkID,
  nonRegularItemTypes,
} from "../../utils/index.js";

export const sql = (full: boolean) => `--sql
SELECT
  items.itemID,
  fieldsCombined.fieldName,
  itemDataValues.value
FROM
  items
  JOIN itemData USING (itemID)
  JOIN itemDataValues USING (valueID)
  JOIN fieldsCombined USING (fieldID)
  JOIN itemTypesCombined USING (itemTypeID)
WHERE
  libraryID = $libId
  ${whereID(full || "items.itemID")}
  AND itemTypesCombined.typeName NOT IN (${nonRegularItemTypes})
  AND ${checkID()}
`;

export interface Output {
  itemID: ItemIDChecked;
  fieldName: DB.FieldsCombined["fieldName"];
  value: DB.ItemDataValues["value"];
  itemType: DB.ItemTypesCombined["typeName"];
}
