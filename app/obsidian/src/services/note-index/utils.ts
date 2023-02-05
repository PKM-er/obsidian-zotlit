import {
  annotKeyPagePattern,
  getItemKeyGroupID,
  itemKeyGroupIdPattern,
  multipleAnnotKeyPagePattern,
} from "@obzt/common";
import { TFile } from "obsidian";
import type { CachedMetadata, SectionCache, TAbstractFile } from "obsidian";
import { ZOTERO_KEY_FIELDNAME } from "@/services/template";
import { getFilePath } from "@/utils";

export const getItemKeyFromFrontmatter = (
  cache: CachedMetadata | null,
): string | null => {
  const field = cache?.frontmatter?.[ZOTERO_KEY_FIELDNAME];
  if (field && typeof field === "string" && itemKeyGroupIdPattern.test(field)) {
    return field;
  }
  return null;
};

export const getItemKeyOf = (file: string | TFile | TAbstractFile | null) => {
  if (!file) return null;
  const cache =
    typeof file === "string"
      ? app.metadataCache.getCache(file)
      : file instanceof TFile
      ? app.metadataCache.getFileCache(file)
      : null;
  return getItemKeyFromFrontmatter(cache);
};

// export const hasBlockWithZtKey = (blocks: Record<string, BlockCache>) =>
//   // must use BlockCache.id, the Record key is converted to lowercase
//   Object.values(blocks).some(({ id }) => multipleAnnotKeyPagePattern.test(id));
export const isAnnotCodeblock = ({ type, id }: SectionCache) =>
  !!id && type === "code" && multipleAnnotKeyPagePattern.test(id);

export const splitMultipleAnnotKey = (key: string): string[] =>
  key.split("n").map((annotKeyWithPage) => {
    const [, annotKey, , groupID] = annotKeyWithPage
      .split("p")[0]
      .match(annotKeyPagePattern)!;
    return getItemKeyGroupID(
      { key: annotKey, groupID: groupID ? +groupID : undefined },
      true,
    );
  });

export function isLiteratureNote(file: string): boolean;
export function isLiteratureNote(file: TAbstractFile): file is TFile;
export function isLiteratureNote(file: TAbstractFile | string): boolean {
  const path = getFilePath(file);
  return !!getItemKeyOf(path);
}
