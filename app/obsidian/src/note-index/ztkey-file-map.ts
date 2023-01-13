import type { KeyFileInfo } from "@obzt/common";
import {
  annotKeyPagePattern,
  itemKeyGroupIdPattern,
  multipleAnnotKeyPagePattern,
  getItemKeyGroupID,
} from "@obzt/common";
import type { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../template";

const getItemKeyFromFrontmatter = (
  cache: CachedMetadata | null,
): string | null => {
  const field = cache?.frontmatter?.[ZOTERO_KEY_FIELDNAME];
  if (field && typeof field === "string" && itemKeyGroupIdPattern.test(field)) {
    return field;
  } else return null;
};

export const getItemKeyOf = (file: string) =>
  getItemKeyFromFrontmatter(app.metadataCache.getCache(file));

export default function* getZoteroKeyFileMap(
  file: string,
  cache: CachedMetadata,
): IterableIterator<KeyFileInfo> {
  if (!(cache.frontmatter && ZOTERO_KEY_FIELDNAME in cache.frontmatter)) {
    return null;
  }
  const itemKey = getItemKeyFromFrontmatter(cache);

  if (!itemKey) return;

  // fileKey
  yield { file, key: itemKey };

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
          key: getItemKeyGroupID(
            { key: annotKey, groupID: groupID ? +groupID : undefined },
            true,
          ),
        };
      }
  }
}
