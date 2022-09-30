import type { KeyFileInfo } from "@obzt/common";
import {
  annotKeyPagePattern,
  itemKeyGroupIdPattern,
  multipleAnnotKeyPagePattern,
  getItemKeyGroupID,
} from "@obzt/common";
import type { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../note-template/const.js";

export default function* getZoteroKeyFileMap(
  file: string,
  cache: CachedMetadata,
): IterableIterator<KeyFileInfo> {
  if (!(cache.frontmatter && ZOTERO_KEY_FIELDNAME in cache.frontmatter)) {
    return null;
  }
  const itemKey = cache.frontmatter[ZOTERO_KEY_FIELDNAME];

  if (!itemKeyGroupIdPattern.test(itemKey)) {
    return;
  }

  // fileKey
  yield { file, ...cache.frontmatter[ZOTERO_KEY_FIELDNAME] };

  // extract annotation keys
  for (const section of cache.sections ?? []) {
    if (
      section.type === "heading" &&
      section.id?.match(multipleAnnotKeyPagePattern)
    )
      for (const annotKeyWithPage of section.id.split("n")) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [, annotKey, , groupID] = annotKeyWithPage
          .split("p")[0]
          .match(annotKeyPagePattern)!;
        yield {
          file: file,
          blockId: section.id,
          key: getItemKeyGroupID({ key: annotKey, groupID: +groupID }, true),
        };
      }
  }
}
