import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

import query from "./query.js";

const getAnnotations: DbWorkerAPI["getAnnotations"] = async (
  attachmentId,
  libId,
) => {
  const db = databases.main.db;
  if (!db) {
    throw new Error("failed to get annotations: no main database opened");
  }
  log.debug(
    `Reading Zotero database for annotations of attachment ${attachmentId}`,
  );
  const annots = await query(db, attachmentId, libId);

  const { key: attachmentKey } =
    (await db.first("key").from("items").where("itemID", attachmentId)) ?? {};
  if (!attachmentKey)
    throw new Error(`failed to get key of attachment ${attachmentId}`);

  log.debug(
    `Finished reading Zotero database for annotations of attachment ${attachmentId}, count: ${annots.length}`,
  );
  return annots.map(({ sortIndex, position, ...annot }) => ({
    ...annot,
    itemID: annot.itemID as number,
    itemType: "annotation",
    parentItemID: attachmentId,
    parentItem: attachmentKey,
    sortIndex: sortIndex?.split("|").map((s) => parseInt(s, 10)) ?? [],
    position: JSON.parse(position),
  }));
};
export default getAnnotations;
