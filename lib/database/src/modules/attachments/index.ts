import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

import query from "./query.js";

const getAttachments: DbWorkerAPI["getAttachments"] = async (docId, libId) => {
  const db = databases.main.db;
  if (!db) {
    throw new Error("failed to get attachments: no main database opened");
  }
  log.debug(`Reading Zotero database for attachments of item ${docId}`);
  const attachments = await query(db, docId, libId);
  log.debug(
    `Finished reading Zotero database for attachments of item ${docId}, count: ${attachments.length}`,
  );
  return attachments;
};
export default getAttachments;
