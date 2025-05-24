import { db } from "@/db/zotero";
import {
  groups,
  itemAnnotations as annotations,
  // itemTypesCombined includes both user-defined and system-defined item types
  itemTypesCombined as itemTypes,
  items as libraryItems,
} from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import {
  itemColumns,
  annotationColumns,
  parseAnnotation,
  sortIndexOrder,
  sortByIndex,
} from "./_common";

type Params = {
  parentItemId: number;
};

const statement = db
  .select({
    ...annotationColumns,
    ...itemColumns,
    groupId: groups.groupId,
    itemType: itemTypes.typeName,
  })
  .from(annotations)
  .innerJoin(libraryItems, eq(annotations.itemId, libraryItems.itemId))
  .leftJoin(groups, eq(libraryItems.libraryId, groups.libraryId))
  .leftJoin(itemTypes, eq(libraryItems.itemTypeId, itemTypes.itemTypeId))
  .where(
    and(
      eq(annotations.parentItemId, sql.placeholder("parentItemId")),
      itemExists(libraryItems.itemId),
    ),
  );

export function getAnnotationsByParentItem({
  parentItemId,
}: { parentItemId: number }) {
  return statement
    .all({ parentItemId } satisfies Params)
    .sort(sortByIndex)
    .map(parseAnnotation);
}
