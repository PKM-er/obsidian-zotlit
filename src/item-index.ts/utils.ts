import { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../note-template";

export type FileMapInfo = { file: string; blockId?: string };
type KeyFileMap = [key: string, info: FileMapInfo];

/** `n` as a seperator between merged */
const ANNOT_BLOCKID_PATTERN = /^(?:[A-Z0-9]+(?:p\d+)?n?)+$/;

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
