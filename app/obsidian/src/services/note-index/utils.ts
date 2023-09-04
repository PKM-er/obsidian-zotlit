import {
  annotKeyPagePattern,
  getItemKeyGroupID,
  itemKeyGroupIdPattern,
  multipleAnnotKeyPagePattern,
} from "@obzt/common";
import { TFile } from "obsidian";
import type {
  App,
  CachedMetadata,
  MetadataCache,
  TAbstractFile,
} from "obsidian";
import { ZOTERO_KEY_FIELDNAME } from "@/services/template";
import { getFilePath } from "@/utils";
import { ZOTERO_ATCHS_FIELDNAME } from "../template/frontmatter";

export const getItemKeyFromFrontmatter = (
  cache: CachedMetadata | null,
): string | null => {
  const field = cache?.frontmatter?.[ZOTERO_KEY_FIELDNAME];
  if (field && typeof field === "string" && itemKeyGroupIdPattern.test(field)) {
    return field;
  }
  return null;
};

export const getItemKeyOf = (
  file: string | TFile | TAbstractFile | null,
  metadataCache: MetadataCache,
) => {
  if (!file) return null;
  const cache =
    typeof file === "string"
      ? metadataCache.getCache(file)
      : file instanceof TFile
      ? metadataCache.getFileCache(file)
      : null;
  return getItemKeyFromFrontmatter(cache);
};

export const getAtchIDsOf = (
  file: string | TFile | TAbstractFile | null,
  metadataCache: MetadataCache,
) => {
  if (!file) return null;
  const cache =
    typeof file === "string"
      ? metadataCache.getCache(file)
      : file instanceof TFile
      ? metadataCache.getFileCache(file)
      : null;
  const field = cache?.frontmatter?.[ZOTERO_ATCHS_FIELDNAME];
  if (field && Array.isArray(field) && field.length > 0) {
    const ids: number[] = [];
    for (const id of field) {
      if (typeof id === "string") {
        const numId = Number(id);
        if (!(numId > 0 && Number.isInteger(numId))) {
          return null;
        }
        ids.push(numId);
      } else if (typeof id === "number") {
        if (!(id > 0 && Number.isInteger(id))) {
          return null;
        }
        ids.push(id);
      }
    }
    return ids;
  }
  return null;
};

// export const hasBlockWithZtKey = (blocks: Record<string, BlockCache>) =>
//   // must use BlockCache.id, the Record key is converted to lowercase
//   Object.values(blocks).some(({ id }) => multipleAnnotKeyPagePattern.test(id));
export const isAnnotBlock = ({ id }: { id?: string }) =>
  !!id && multipleAnnotKeyPagePattern.test(id);

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

export function isLiteratureNote(file: string, app: App): boolean;
export function isLiteratureNote(file: TAbstractFile, app: App): file is TFile;
export function isLiteratureNote(
  file: TAbstractFile | string,
  app: App,
): boolean {
  const path = getFilePath(file);
  return !!getItemKeyOf(path, app.metadataCache);
}
