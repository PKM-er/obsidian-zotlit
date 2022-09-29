import type { Knex } from "@knex";

const queryTags = (knex: Knex, itemIds: number[], libId: number) =>
  knex
    .select("itemID", "type", "name")
    .from("itemTags")
    .join("items", (j) => j.using("itemID"))
    .join("tags", (j) => j.using("tagID"))
    .whereIn("itemID", itemIds)
    .andWhere("libraryID", libId);

export default queryTags;
