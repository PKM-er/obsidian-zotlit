import { join } from "path";
import type { AttachmentInfo, RegularItemInfoBase } from "../index.js";

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
/**
 * compare sortIndex in format of '123|455|789'
 */

export const sortBySortIndex = (aIdx: number[], bIdx: number[]) => {
  for (let i = 0; i < aIdx.length; i++) {
    if (aIdx[i] !== bIdx[i]) {
      return aIdx[i] - bIdx[i];
    }
  }
  return 0;
};

export const isFileAttachment = (i: AttachmentInfo): boolean => Boolean(i.path);

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const toLocalStorageKey = (docItem: RegularItemInfoBase) =>
  `obzt-active-atch-${docItem.itemID}-${docItem.libraryID}`;

export const getCachedActiveAtch = (
  storage: Storage,
  docItem: RegularItemInfoBase,
) => {
  const raw = storage.getItem(toLocalStorageKey(docItem));
  if (!raw) return null;
  const val = parseInt(raw, 10);
  if (val > 0) return val;
  return null;
};

export const cacheActiveAtch = (
  storage: Storage,
  docItem: RegularItemInfoBase,
  atchID: number,
) => storage.setItem(toLocalStorageKey(docItem), atchID.toString());
