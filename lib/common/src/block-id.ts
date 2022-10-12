export interface ItemKeyGroup {
  key: string;
  groupID?: number | null;
  parentItem?: string;
}

/**
 * @param index set to true to generate key without parentItem to be used for indexing
 * @returns ITEMKEY(gGROUPID) / ANNOT_KEYaATTACHMENT_KEY(gGROUPID)
 */
export const getItemKeyGroupID = (
  { key, groupID, parentItem }: ItemKeyGroup,
  index = false,
) => {
  const parts = [key];
  if (!index && parentItem) {
    // a => at
    parts.push(`a${parentItem}`);
  }
  if (typeof groupID === "number") {
    parts.push(`g${groupID}`);
  }
  return parts.join("");
};

type FileMapInfo = { file: string; blockId?: string };
export type KeyFileInfo = Record<"key", string> & FileMapInfo;

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
    const parts = {
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

export const // itemKeyPattern = getRegExp()`^{itemKeyBase}`,
  itemKeyGroupIdPattern = getRegExp()`${itemKeyBase}(?:g${idBase})?`,
  annotKeyPagePattern = getRegExp()`${annotKeyPageBase(true)}`,
  /**
   * 9DCRTRSC   a    9DCRTRSC     g  123   p 131  n  9DCRT...
   *
   * ^^^^^^^^   a    ^^^^^^^^        ^^^     ^^^     ^^^^^^^
   *
   * annot-key  @  attachment-key  group-id  page   next-item
   */
  multipleAnnotKeyPagePattern = getRegExp()`(?:${annotKeyPageBase(false)}n?)+`;

/** convert pagelabel to page interger */
export const toPage = (pageLabel: string | null | number): number | null => {
  if (pageLabel === null) return null;
  if (typeof pageLabel === "number") {
    return Number.isInteger(pageLabel) ? pageLabel : null;
  }
  const page = parseInt(pageLabel, 10);
  if (Number.isInteger(page)) {
    return page;
  } else {
    return null;
  }
};
