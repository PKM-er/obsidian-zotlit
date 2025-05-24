import { db } from "@/db/zotero";
import {
  groups,
  itemAnnotations as annotations,
  // itemTypesCombined includes both user-defined and system-defined item types
  itemTypesCombined as itemTypes,
  items as libraryItems,
} from "@zt/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { parseSortIndex } from "@/lib/sort-index";
import { parseAnnotationPosition } from "@/lib/position";
import { pick } from "@std/collections";
import { itemExists } from "../_where";

const annotationColumns = pick(annotations, [
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
const itemColumns = pick(libraryItems, [
  "key",
  "clientDateModified",
  "dateAdded",
  "dateModified",
  "libraryId",
]);

const baseQuery = db
  .select({
    ...annotationColumns,
    ...itemColumns,
    groupId: groups.groupId,
    itemType: itemTypes.typeName,
  })
  .from(annotations)
  .innerJoin(libraryItems, eq(annotations.itemId, libraryItems.itemId))
  .leftJoin(groups, eq(libraryItems.libraryId, groups.libraryId))
  .leftJoin(itemTypes, eq(libraryItems.itemTypeId, itemTypes.itemTypeId));

/**
 * Zotero only use sortIndex as a string to sort items... wtf
 * @see https://github.com/zotero/zotero/blob/3ff13bc08ddfc01b29e6a30136a06f5a1259abd5/chrome/content/zotero/xpcom/data/items.js#L685
 */
const sortIndexOrder = asc(annotations.sortIndex);

export async function getAnnotationsByKey({
  items: inputs,
  libraryId,
}: { items: { key: string }[]; libraryId: number }) {
  const result = await baseQuery
    .where(
      and(
        inArray(
          libraryItems.key,
          inputs.map((v) => v.key),
        ),
        eq(libraryItems.libraryId, libraryId),
        itemExists(libraryItems.itemId),
      ),
    )
    .orderBy(sortIndexOrder);
  return result.map(parseAnnotation);
}

export async function getAnnotationsByParentItem({
  parentItemId,
  libraryId,
}: {
  parentItemId: number;
  libraryId: number;
}) {
  const result = await baseQuery
    .where(
      and(
        eq(annotations.parentItemId, parentItemId),
        eq(libraryItems.libraryId, libraryId),
        itemExists(libraryItems.itemId),
      ),
    )
    .orderBy(sortIndexOrder);
  return result.map(parseAnnotation);
}

function parseAnnotation<T extends Record<"sortIndex" | "position", string>>({
  position,
  sortIndex,
  ...rest
}: T) {
  return {
    ...rest,
    sortIndex: parseSortIndex(sortIndex, () => rest),
    position: parseAnnotationPosition(position, () => rest),
  };
}
