import { db } from "@/db/zotero";
import { itemAnnotations as annotations, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import {
  itemColumns,
  annotationColumns,
  parseAnnotation,
  sortByIndex,
} from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  parentItemId: v.number(),
});

const statement = db
  .select({
    ...annotationColumns,
    ...itemColumns,
  })
  .from(annotations)
  .innerJoin(items, eq(annotations.itemId, items.itemId))
  .where(
    and(
      eq(annotations.parentItemId, sql.placeholder("parentItemId")),
      itemExists(items.itemId),
    ),
  );

export function getAnnotationsByParentItem({
  parentItemId,
}: { parentItemId: number }) {
  return statement
    .all(v.parse(ParamsSchema, { parentItemId }))
    .sort(sortByIndex)
    .map(parseAnnotation);
}
