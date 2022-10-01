import type { Knex } from "@knex";

const queryAttachments = (knex: Knex, itemId: number, libId: number) =>
  knex
    .select("itemAttachments.itemID" as "itemID", "path", "key")
    .count({ count: "itemAnnotations.itemID" })
    .from("itemAttachments")
    .join("items", (j) => j.using("itemID"))
    .leftJoin("itemAnnotations", (j) =>
      j.on("itemAttachments.itemID", "itemAnnotations.parentItemID"),
    )
    .where("itemAttachments.parentItemID", itemId)
    .andWhere("libraryID", libId)
    .whereNotIn(
      "itemAttachments.itemID",
      knex.select("itemID").from("deletedItems"),
    )
    .groupBy("itemAttachments.itemID");

export default queryAttachments;
