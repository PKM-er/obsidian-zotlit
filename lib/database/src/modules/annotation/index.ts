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
  log.debug(
    `Finished reading Zotero database for annotations of attachment ${attachmentId}, count: ${annots.length}`,
  );
  return annots;
};
export default getAnnotations;
