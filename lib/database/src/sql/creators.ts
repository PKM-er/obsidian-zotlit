import type { DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../utils/index.js";
import { Prepared, checkItemID } from "../utils/index.js";

const query = `--sql
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
  AND ${checkItemID()}
ORDER BY
  itemID,
  orderIndex
`;

interface Input {
  libId: number;
}

interface Output {
  itemID: ItemIDChecked;
  firstName: DB.Creators["firstName"];
  lastName: DB.Creators["lastName"];
  fieldMode: DB.Creators["fieldMode"];
  creatorType: DB.CreatorTypes["creatorType"];
  orderIndex: DB.ItemCreators["orderIndex"];
}

export class Creators extends Prepared<Output, Input> {
  sql(): string {
    return query;
  }
}
