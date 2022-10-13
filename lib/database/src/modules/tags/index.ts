import type { ItemTag } from "@obzt/zotero-type";
import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

import query from "./query.js";

const getTags: DbWorkerAPI["getTags"] = async (itemIds, libId) => {
  const db = databases.main.db;
  if (!db) {
    throw new Error("failed to get tags: no main database opened");
  }
  log.debug(`Reading Zotero database for tags of item ${itemIds.join(", ")}`);
  const tags = await query(db, itemIds, libId);
  log.debug(
    `Finished reading Zotero database for tags of item ${itemIds.join(
      ", ",
    )}, count: ${tags.length}`,
  );
  return tags.reduce(
    (rec, tag) => (rec[tag.itemID].push(tag), rec),
    Object.fromEntries(itemIds.map((id) => [id, [] as ItemTag[]] as const)),
  );
};
export default getTags;
