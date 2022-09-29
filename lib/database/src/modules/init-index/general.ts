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

export const itemSQL = (knex: Knex, libId: number) =>
  knex
    .select("libraryID", "groupID", "key", "itemID", "typeName")
    .from("items")
    .join("itemTypesCombined", (j) => j.using("itemTypeID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .where("libraryID", libId)
    .whereNotIn("itemType", nonRegularItemTypes)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));

export const itemFieldsSQL = (knex: Knex, libId: number) =>
  knex
    .select("itemID", "fieldName", "value")
    .from("items")
    .join("itemData", (j) => j.using("itemID"))
    .join("itemDataValues", (j) => j.using("valueID"))
    .join("fieldsCombined", (j) => j.using("fieldID"))
    .where("libraryID", libId)
    .whereNotIn("itemType", nonRegularItemTypes)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));

export type Item = {
  itemID: number | null;
  libraryID: number;
  key: string;
  groupID: number | null;
  typeName: string;
};
export type ItemField = {
  itemID: number | null;
  fieldName: string;
  value: unknown;
};
