import * as v from "valibot";

/**
 * @see https://github.com/zotero/zotero/blob/3ff13bc08ddfc01b29e6a30136a06f5a1259abd5/chrome/content/zotero/xpcom/data/item.js#L4064
 */
const sortIndexSchema = v.regex(/^(\d{5}\|\d{6}\|\d{5}|\d{5}\|\d{8}|\d{7,8})$/);
export type SortIndex = [number, number, number] | [number, number] | [number];

const sortIndexFieldSchema = v.pipe(
  v.string(),
  sortIndexSchema,
  v.transform(
    (v) => v.split("|").map((s) => Number.parseInt(s, 10)) as SortIndex,
  ),
);

export function parseSortIndex(
  sortIndex: string,
  ctx: () => Record<string, unknown>,
): SortIndex | null {
  const result = v.safeParse(sortIndexFieldSchema, sortIndex);
  if (result.success) {
    return result.output;
  }
  console.warn("Failed to parse sort index", sortIndex, ctx());
  return null;
}
