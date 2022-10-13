import type { Knex } from "@knex";

const queryAttachments = async (knex: Knex, itemId: number, libId: number) => {
  const result = await knex
    .select("itemAttachments.itemID" as "itemID", "path", "key")
    .count({ count: "itemAnnotations.itemID" })
    .from("itemAttachments")
    .join("items", (j) => j.using("itemID"))
    .leftJoin("itemAnnotations", (j) =>
      j.on("itemAttachments.itemID", "itemAnnotations.parentItemID"),
    )
    .where("itemAttachments.parentItemID", itemId)
    .andWhere("libraryID", libId)
    .whereNotNull("itemID")
    .whereNotIn(
      "itemAttachments.itemID",
      knex.select("itemID").from("deletedItems"),
    )
    .groupBy("itemAttachments.itemID");
  type Item = typeof result[0];
  type Return = Item & { itemID: number };
  return result as unknown as Return[];
};

export default queryAttachments;
