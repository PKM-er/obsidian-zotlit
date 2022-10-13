import type { Knex } from "@knex";
import type { Libraries } from "../../db-types";

const queryAnnotations = (knex: Knex, attachmentId: number, libId: number) =>
  knex
    .select(
      "itemID",
      "key",
      "libraryID",
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
    .join<Omit<Libraries, "type">>("libraries", (j) => j.using("libraryID"))
    .leftJoin("groups", (j) => j.using("libraryID"))
    .where("parentItemID", attachmentId)
    .whereNotNull("itemID")
    .andWhere("libraryID", libId)
    .whereNotIn("itemID", knex.select("itemID").from("deletedItems"));

export default queryAnnotations;
