import { itemAnnotations as annotations } from "@zt/schema";
import { asc } from "drizzle-orm";

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
