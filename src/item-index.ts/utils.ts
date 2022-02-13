import { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../note-template";

export type FileMapInfo = { file: string; blockId?: string };
type KeyFileMap = [key: string, info: FileMapInfo];

/**
 * from https://github.com/zotero/utilities/blob/37e33ba87a47905441baaafb90999abbb4ab6b1e/utilities.js#L1589-L1594
 * `n` as a seperator between merged
 */
const ANNOT_BLOCKID_PATTERN =
  /^(?:[23456789ABCDEFGHIJKLMNPQRSTUVWXYZ]{8}(?:p\d+)?n?)+$/;

export function* getZoteroKeyFileMap(
  file: string,
  cache: CachedMetadata,
): IterableIterator<KeyFileMap> {
  if (!(cache.frontmatter && ZOTERO_KEY_FIELDNAME in cache.frontmatter)) {
    return null;
  }

  // fileKey
  yield [cache.frontmatter[ZOTERO_KEY_FIELDNAME], { file: file }];

  // extract annotation keys
  for (const section of cache.sections ?? []) {
    if (section.type === "heading" && section.id?.match(ANNOT_BLOCKID_PATTERN))
      for (const annotKeyWithPage of section.id.split("n")) {
        const annotKey = annotKeyWithPage.split("p")[0];
        yield [annotKey, { file: file, blockId: section.id }];
      }
  }
}
