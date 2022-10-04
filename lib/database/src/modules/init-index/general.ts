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

export const itemSQL = async (knex: Knex, libId: number) => {
  const result = await knex
    .select(
      "libraryID",
      "groupID",
      "key",
      "itemID",
      // knexjs typescript don't support infer alias
      // patched when returning
      "typeName as itemType" as "typeName",
    )
    .from("items")
    .join("itemTypesCombined", (j) => j.using("itemTypeID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .whereNotNull("itemID")
    .where("libraryID", libId)
    .whereNotIn("itemType", nonRegularItemTypes)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));

  type Item = typeof result[0];
  type Return = Omit<Item, "typeName"> & {
    itemType: Item["typeName"];
    itemID: number;
  };
  return result as unknown as Return[];
};

export const itemFieldsSQL = (knex: Knex, libId: number) =>
  knex
    .select("itemID", "fieldName", "value")
    .from("items")
    .join("itemData", (j) => j.using("itemID"))
    .join("itemDataValues", (j) => j.using("valueID"))
    .join("fieldsCombined", (j) => j.using("fieldID"))
    .join("itemTypesCombined", (j) => j.using("itemTypeID"))
    .where("libraryID", libId)
    .whereNotIn("typeName", nonRegularItemTypes)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));
