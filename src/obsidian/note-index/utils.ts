import type { CachedMetadata } from "obsidian";

import { ZOTERO_KEY_FIELDNAME } from "../note-template/const";

export type FileMapInfo = { file: string; blockId?: string };
type KeyFileMap = [key: string, info: FileMapInfo];

/**
 * @param getValFromExp get string to fill the template from expression
 * @returns Tag functions that returns string
 */
const spread =
    <TIn, TOut = string>(
      getValFromExp: (input: TIn) => string,
      getOutput: (newStr: string) => TOut,
      raw = true,
    ) =>
    (strings: TemplateStringsArray, ...exps: TIn[]): TOut => {
      let newStr = "";
      for (let i = 0; i < strings.length; i++) {
        if (i > 0) newStr += getValFromExp(exps[i - 1]);
        newStr += (raw ? strings.raw : strings)[i];
      }
      return getOutput(newStr);
    },
  getRegExp = (exact = true, flag?: string) =>
    spread(
      (str: string) => str,
      (str) => new RegExp(exact ? "^" + str + "$" : str, flag),
      true,
    );
/**
 * from https://github.com/zotero/utilities/blob/37e33ba87a47905441baaafb90999abbb4ab6b1e/utilities.js#L1589-L1594
 * `n` as a seperator between merged
 */
const itemKeyBase = String.raw`[23456789ABCDEFGHIJKLMNPQRSTUVWXYZ]{8}`,
  /**
   * 9DCRTRSC  g  123    OR  9DCRTRSC
   *
   * ^^^^^^^^     ^^^        ^^^^^^^^
   *
   * item-key   group-id     item-key (no suffix=>lib-id=1)
   */
  idBase = String.raw`\d+`,
  annotKeyPageBase = (cache: boolean) => {
    let parts = {
      annotKey: itemKeyBase,
      parentKey: itemKeyBase,
      groupID: idBase,
      page: idBase,
    };
    if (cache) {
      for (const key in parts) {
        // @ts-ignore
        parts[key] = `(${parts[key]})`;
      }
    }
    return spread(
      (key: keyof typeof parts) => parts[key],
      (str) => str,
    )`${"annotKey"}a${"parentKey"}(?:g${"groupID"})?(?:p${"page"})?`;
  };

const // itemKeyPattern = getRegExp()`^{itemKeyBase}`,
  itemKeyGroupIdPattern = getRegExp()`${itemKeyBase}(?:g${idBase})?`,
  annotKeyPagePattern = getRegExp()`${annotKeyPageBase(true)}`,
  /**
   * 9DCRTRSC     9DCRTRSC     g  123   p 131  n  9DCRT...
   *
   * ^^^^^^^^     ^^^^^^^^        ^^^     ^^^     ^^^^^^^
   *
   * annot-key  attachment-key  group-id  page   next-item
   */
  multipleAnnotKeyPagePattern = getRegExp()`(?:${annotKeyPageBase(false)}n?)+`;

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
        const [, annotKey, , groupID] = annotKeyWithPage
          .split("p")[0]
          .match(annotKeyPagePattern)!;
        yield [
          groupID ? `${annotKey}g${groupID}` : annotKey,
          { file: file, blockId: section.id },
        ];
      }
  }
}
