import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../utils/index.js";
import { Prepared, checkID } from "../utils/index.js";

const query = `--sql
SELECT
  atchs.itemID,
  atchs.path,
  atchs.contentType,
  atchs.linkMode,
  charsets.charset,
  items.key,
  COUNT(atchs.itemID) as annotCount
FROM
  itemAttachments atchs
  JOIN items USING (itemID)
  LEFT JOIN charsets USING (charsetID)
  LEFT JOIN itemAnnotations annots ON atchs.itemID = annots.parentItemID
WHERE
  atchs.parentItemID = $itemId
  AND libraryID = $libId
  AND ${checkID("atchs.itemID")}
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
  contentType: DB.ItemAttachments["contentType"];
  linkMode: DB.ItemAttachments["linkMode"];
  charsets: DB.Charsets["charset"] | null;
  annotCount: number;
}

export class Attachements extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
