import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";
import { whereItemID, checkItemID } from "../../utils/index.js";

export const sql = (full: boolean) => `--sql
SELECT
  itemID,
  creators.firstName,
  creators.lastName,
  creators.fieldMode,
  creatorTypes.creatorType,
  orderIndex
FROM
  items
  LEFT JOIN itemCreators USING (itemID)
  JOIN creators USING (creatorID)
  JOIN creatorTypes USING (creatorTypeID)
WHERE
  libraryID = $libId
  ${whereItemID(full || "itemID")}
  AND ${checkItemID()}
ORDER BY
  itemID,
  orderIndex
`;

export interface Output {
  itemID: ItemIDChecked;
  firstName: DB.Creators["firstName"];
  lastName: DB.Creators["lastName"];
  fieldMode: DB.Creators["fieldMode"];
  creatorType: DB.CreatorTypes["creatorType"];
  orderIndex: DB.ItemCreators["orderIndex"];
}
