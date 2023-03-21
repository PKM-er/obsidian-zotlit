import { join } from "path";

/**
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L42-L45
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L99-L112
 */

export const getCacheImagePath = (
  { groupID, key: annoKey }: { groupID: number | null; key: string },
  dataDir: string,
) => {
  const parts = [dataDir, "cache"];
  if (!groupID) {
    parts.push("library");
  } else {
    parts.push("groups", groupID.toString());
  }
  return join(...parts, annoKey + ".png");
};
