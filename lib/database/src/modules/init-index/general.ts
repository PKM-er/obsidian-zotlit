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

import type { Knex } from "@knex";

const betterBibTexSql = (knex: Knex, libId: number) =>
  knex
    .select(
      "libraryID",
      "groupID",
      "key",
      "itemID",
      "typeName AS itemType",
      "fieldName",
      "value",
    )
    .from("items")
    .join("itemData", function () {
      this.using("itemID");
    })
    .join("itemDataValues", function () {
      this.using("valueID");
    })
    .join("fields", function () {
      this.using("fieldID");
    })
    .join("itemTypes", function () {
      this.using("itemTypeID");
    })
    .leftJoin("groups", function () {
      this.using("libraryID");
    })
    .where("libraryID", libId)
    .whereNotIn("itemType", ["annotation", "attachment", "note"])
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));
export default betterBibTexSql;
