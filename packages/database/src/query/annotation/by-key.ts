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
  key: string;
  libraryId: number;
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
      eq(libraryItems.key, sql.placeholder("key")),
      eq(libraryItems.libraryId, sql.placeholder("libraryId")),
      itemExists(libraryItems.itemId),
    ),
  );

export function getAnnotationsByKey({
  keys,
  libraryId,
}: { keys: string[]; libraryId: number }) {
  return new Map(
    keys
      .map((key) => statement.get({ key, libraryId } satisfies Params))
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.key, parseAnnotation(v)]),
  );
}
