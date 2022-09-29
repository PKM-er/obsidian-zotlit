// SELECT
//   libraryID,
//   groupID,
//   key,
//   itemID,
//   typeName itemType,
//   fieldName,
//   value
// FROM
//   items
//   JOIN itemData USING (itemID)
//   JOIN itemDataValues USING (valueID)
//   JOIN fields USING (fieldID)
//   JOIN itemTypes USING (itemTypeID)
//   LEFT JOIN groups USING (libraryID)
// WHERE
//   libraryID = ?
//   AND itemType NOT IN ('annotation', 'attachment', 'note')
//   AND itemID NOT IN (
//     SELECT
//       itemID
//     FROM
//       deletedItems
//   )

import { nonRegularItemTypes } from "@obzt/zotero-type";
import type { Knex } from "@knex";

const sql = (knex: Knex, libId: number) =>
  knex
    .select(
      "libraryID",
      "groupID",
      "key",
      "itemID",
      "typeName",
      "fieldName",
      "value",
    )
    .from("items")
    .join("itemData", (j) => j.using("itemID"))
    .join("itemDataValues", (j) => j.using("valueID"))
    .join("fields", (j) => j.using("fieldID"))
    .join("itemTypes", (j) => j.using("itemTypeID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .where("libraryID", libId)
    .whereNotIn("typeName", nonRegularItemTypes)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));
export default sql;
