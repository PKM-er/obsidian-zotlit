import type { Knex } from "@knex";

const queryAttachments = (knex: Knex, itemId: number, libId: number) =>
  knex
    .select("itemAttachments.itemID" as "itemID", "path", "key")
    .count({ count: "itemAttachments.itemID" })
    .from("itemAttachments")
    .join("items", (j) => j.using("itemID"))
    .join("itemAnnotations", (j) =>
      j.on("itemAttachments.itemID", "itemAnnotations.parentItemID"),
    )
    .where("itemAttachments.parentItemID", itemId)
    .andWhere("libraryID", libId)
    .groupBy("itemAttachments.itemID");

export default queryAttachments;
