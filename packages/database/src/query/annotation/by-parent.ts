import { itemAnnotations as annotations, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { sortByIndex } from "./_sort";
import * as v from "valibot";
import { buildAnnotationQuery } from "./_sql";
import { parseAnnotation } from "./_parse";

const ParamsSchema = v.object({
  parentItemId: v.number(),
});

const statement = buildAnnotationQuery()
  .where(
    and(
      eq(annotations.parentItemId, sql.placeholder("parentItemId")),
      itemExists(items.itemId),
    ),
  )
  .prepare();

export function getAnnotationsByParentItem({
  parentItemId,
}: { parentItemId: number }) {
  return statement
    .all(v.parse(ParamsSchema, { parentItemId }))
    .sort(sortByIndex)
    .map(parseAnnotation);
}
