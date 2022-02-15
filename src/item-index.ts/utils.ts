import type { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../note-template";

export type FileMapInfo = { file: string; blockId?: string };
type KeyFileMap = [key: string, info: FileMapInfo];

/**
 * from https://github.com/zotero/utilities/blob/37e33ba87a47905441baaafb90999abbb4ab6b1e/utilities.js#L1589-L1594
 * `n` as a seperator between merged
 */
const itemKeyPatternBase = "[23456789ABCDEFGHIJKLMNPQRSTUVWXYZ]{8}",
  /**
   * 9DCRTRSC  g  123    OR  9DCRTRSC
   *
   * ^^^^^^^^     ^^^        ^^^^^^^^
   *
   * item-key   group-id     item-key (no suffix=>lib-id=1)
   */
  itemKeyGroupIdPatternBase = itemKeyPatternBase + "(?:g\\d+)?";

const itemKeyPattern = new RegExp("^" + itemKeyPatternBase + "$"),
  itemKeyGroupIdPattern = new RegExp("^" + itemKeyGroupIdPatternBase + "$"),
  /**
   * 9DCRTRSC  g  123   p 131  n  9DCRT...
   *
   * ^^^^^^^^     ^^^     ^^^     ^^^^^^^
   *
   * item-key group-id   page   next-item
   */
  multipleAnnotKeyPagePattern = new RegExp(
    "^(?:" + itemKeyGroupIdPatternBase + "(?:p\\d+)?n?)+$",
  );

export function* getZoteroKeyFileMap(
  file: string,
  cache: CachedMetadata,
): IterableIterator<KeyFileMap> {
  if (!(cache.frontmatter && ZOTERO_KEY_FIELDNAME in cache.frontmatter)) {
    return null;
  }
  const itemKey = cache.frontmatter[ZOTERO_KEY_FIELDNAME];

  if (!itemKeyGroupIdPattern.test(itemKey)) {
    return;
  }

  // fileKey
  yield [cache.frontmatter[ZOTERO_KEY_FIELDNAME], { file: file }];

  // extract annotation keys
  for (const section of cache.sections ?? []) {
    if (
      section.type === "heading" &&
      section.id?.match(multipleAnnotKeyPagePattern)
    )
      for (const annotKeyWithPage of section.id.split("n")) {
        const annotKey = annotKeyWithPage.split("p")[0];
        yield [annotKey, { file: file, blockId: section.id }];
      }
  }
}
