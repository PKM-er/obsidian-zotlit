import type { Annotation } from "@obzt/zotero-type";
import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

import queryAtch from "./query-atch.js";
import queryKey from "./query-key.js";

export const getAnnotations: DbWorkerAPI["getAnnotations"] = async (
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
  const annots = await queryAtch(db, attachmentId, libId);

  const { key: attachmentKey } =
    (await db.first("key").from("items").where("itemID", attachmentId)) ?? {};
  if (!attachmentKey)
    throw new Error(`failed to get key of attachment ${attachmentId}`);

  log.debug(
    `Finished reading Zotero database for annotations of attachment ${attachmentId}, count: ${annots.length}`,
  );
  return annots.map(({ sortIndex, position, ...annot }) => ({
    ...annot,
    itemType: "annotation",
    parentItemID: attachmentId,
    parentItem: attachmentKey,
    ...parsePosSortIndex(position, sortIndex),
  }));
};

const parsePosSortIndex = (position: string, sortIndex: string) => ({
  sortIndex: sortIndex?.split("|").map((s) => parseInt(s, 10)) ?? [],
  position: JSON.parse(position),
});

export const getAnnotFromKey: DbWorkerAPI["getAnnotFromKey"] = async (
  keys: string[],
  libId,
) => {
  const db = databases.main.db;
  if (!db) {
    throw new Error(
      "failed to get annotations from keys: no main database opened",
    );
  }
  log.debug(`Reading Zotero database for annotations from keys ${keys}`);
  const annots = await queryKey(db, keys, libId);

  return annots.reduce(
    (rec, { sortIndex, position, ...annot }) => (
      (rec[annot.key] = {
        ...annot,
        itemType: "annotation",
        ...parsePosSortIndex(position, sortIndex),
      }),
      rec
    ),
    {} as Record<string, Annotation>,
  );
};
