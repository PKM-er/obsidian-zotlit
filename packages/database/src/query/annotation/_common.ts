import { parseAnnotationPosition } from "@/lib/position";
import { parseSortIndex } from "@/lib/sort-index";
import {
  itemAnnotations as annotations,
  items as libraryItems,
} from "@zt/schema";
import { asc } from "drizzle-orm";
import { pick } from "@std/collections";
import { ZoteroEnumSchema } from "@/lib/zt-enum";

import * as v from "valibot";

export function parseAnnotation<
  T extends Record<"sortIndex" | "position", string> & {
    type: number;
  },
>({ position, sortIndex, type, ...rest }: T) {
  return {
    ...rest,
    type: v.parse(ZoteroEnumSchema, type),
    sortIndex: parseSortIndex(sortIndex, () => rest),
    position: parseAnnotationPosition(position, () => rest),
  };
}

export const annotationColumns = pick(annotations, [
  "itemId",
  "type",
  "authorName",
  "text",
  "comment",
  "color",
  "pageLabel",
  "sortIndex",
  "position",
  "isExternal",
]);
export const itemColumns = pick(libraryItems, ["key", "libraryId"]);

/**
 * Zotero only use sortIndex as a string to sort items... wtf
 * @see https://github.com/zotero/zotero/blob/3ff13bc08ddfc01b29e6a30136a06f5a1259abd5/chrome/content/zotero/xpcom/data/items.js#L685
 */
export const sortIndexOrder = asc(annotations.sortIndex);
export const sortByIndex = (
  (collator: Intl.Collator) =>
  <T extends { sortIndex: string | undefined | null }>(a: T, b: T) =>
    collator.compare(a.sortIndex ?? "", b.sortIndex ?? "")
)(new Intl.Collator("en-US", { numeric: true }));
