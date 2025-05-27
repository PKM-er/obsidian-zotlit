import { join } from "node:path";

/**
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L42-L45
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L99-L112
 */

export const getCacheImagePath = (
  { groupId, key }: { groupId: number | null; key: string },
  dataDir: string,
) => {
  const filename = `${key}.png`;
  if (groupId) {
    return join(dataDir, "cache", "groups", groupId.toString(), filename);
  }
  return join(dataDir, "cache", "library", filename);
};
