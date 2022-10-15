import type { Knex } from "@knex";
import type { Libraries } from "../../db-types";

const queryAnnotations = async (knex: Knex, keys: string[], libId: number) => {
  const result = await knex
    .select(
      "items.itemID" as "itemID",
      "items.key" as "key",
      "parentItemID",
      "parentItems.key as parentItem" as "key",
      "items.libraryID" as "libraryID",
      "groupID",
      "itemAnnotations.type" as "type",
      "authorName",
      "text",
      "comment",
      "color",
      "pageLabel",
      "sortIndex",
      "position",
      "isExternal",
    )
    .from("itemAnnotations")
    .join("items", (j) => j.using("itemID"))
    .join("items as parentItems" as "items", (j) =>
      j.on("parentItemID", "parentItems.itemID"),
    )
    .join<Omit<Libraries, "type">>("libraries", (j) =>
      j.on("libraries.libraryID", "items.libraryID"),
    )
    .leftJoin("groups", (j) => j.on("groups.libraryID", "items.libraryID"))
    .whereIn("items.key", keys)
    .whereNotNull("items.itemID")
    .andWhere("items.libraryID", libId)
    .whereNotIn("items.itemID", knex.select("itemID").from("deletedItems"));
  type Item = typeof result[0];
  type Return = Item & { parentItem: string; itemID: number };
  return result as unknown as Return[];
};

export default queryAnnotations;
