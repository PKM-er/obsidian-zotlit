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
  itemId: v.number(),
});

const statement = db
  .select({
    ...annotationColumns,
    ...itemColumns,
  })
  .from(annotations)
  .innerJoin(items, eq(annotations.itemId, items.itemId))
  .where(
    and(eq(items.itemId, sql.placeholder("itemId")), itemExists(items.itemId)),
  );

export function getAnnotationsById({ items }: { items: { itemId: number }[] }) {
  return new Map(
    items
      .map(({ itemId }) => statement.get(v.parse(ParamsSchema, { itemId })))
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.itemId, parseAnnotation(v)]),
  );
}
