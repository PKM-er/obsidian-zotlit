import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../utils/index.js";
import { Prepared, checkItemID, nonRegularItemTypes } from "../utils/index.js";

const query = `--sql
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
  AND itemTypesCombined.typeName NOT IN (${nonRegularItemTypes})
  AND ${checkItemID()}
`;

interface Input {
  libId: number;
}

interface Output {
  itemID: ItemIDChecked;
  fieldName: DB.FieldsCombined["fieldName"];
  value: DB.ItemDataValues["value"];
  itemType: DB.ItemTypesCombined["typeName"];
}

export class ItemFields extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
