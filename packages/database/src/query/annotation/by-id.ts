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
  sortByIndex,
} from "./_common";

interface Params {
  itemId: number;
}

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
      eq(libraryItems.itemId, sql.placeholder("itemId")),
      itemExists(libraryItems.itemId),
    ),
  );

export function getAnnotationsById({ items }: { items: { itemId: number }[] }) {
  return new Map(
    items
      .map(({ itemId }) => statement.get({ itemId } satisfies Params))
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.itemId, parseAnnotation(v)]),
  );
}
