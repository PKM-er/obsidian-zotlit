import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../utils/index.js";
import { Prepared, checkItemID, nonRegularItemTypes } from "../utils/index.js";

const query = `--sql
SELECT
  items.itemID,
  items.key,
  itemTypesCombined.typeName as itemType
FROM 
  items
  JOIN itemTypesCombined USING (itemTypeID)
WHERE 
  ${checkItemID()}
  AND libraryID = $libId
  AND itemType NOT IN (${nonRegularItemTypes})
`;

interface Input {
  libId: number;
}

interface Output {
  itemID: ItemIDChecked;
  key: DB.Items["key"];
  itemType: DB.ItemTypesCombined["typeName"];
}

export class Items extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
