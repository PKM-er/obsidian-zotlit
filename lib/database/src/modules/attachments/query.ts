import type { Knex } from "@knex";

declare module "@aidenlx/knex/types/tables" {
  export interface Attachment {
    itemID: number;
    parentItemID: number;
    linkMode: number;
    contentType: string;
    charsetID: number;
    path: string;
    syncState: number;
    storageModTime: number;
    storageHash: string;
    lastProcessedModificationTime: number;
  }

  interface Tables {
    itemAttachments: Attachment;
  }
}

const queryAttachments = (knex: Knex, itemId: number, libId: number) =>
  knex
    .select("itemAttachments.itemID" as "itemID")
    .count({ count: "attachments.itemID" })
    .from("itemAttachments")
    .join("items", (j) => j.using("itemID"))
    .join("itemAnnotations", (j) =>
      j.on("itemAttachments.itemID", "itemAnnotations.parentItemID"),
    )
    .where("itemAttachments.parentItemID", itemId)
    .andWhere("libraryID", libId)
    .groupBy("attachments.itemID");

export default queryAttachments;
