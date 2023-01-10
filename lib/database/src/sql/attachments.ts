import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../utils/index.js";
import { Prepared, checkItemID } from "../utils/index.js";

const query = `--sql
SELECT
  atchs.itemID,
  atchs.path,
  items.key,
  COUNT(atchs.itemID) as annotCount
FROM
  itemAttachments atchs
  JOIN items USING (itemID)
  LEFT JOIN itemAnnotations annots ON atchs.itemID = annots.parentItemID
WHERE
  atchs.parentItemID = $itemId
  AND libraryID = $libId
  AND ${checkItemID("atchs.itemID")}
GROUP BY atchs.itemID
`;

interface Input {
  itemId: number;
  libId: number;
}

export interface Output {
  itemID: ItemIDChecked;
  path: DB.ItemAttachments["path"];
  key: DB.Items["key"];
  annotCount: number;
}

export class Attachements extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
