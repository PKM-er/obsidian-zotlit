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
  key: v.string(),
  libraryId: v.number(),
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
      eq(items.key, sql.placeholder("key")),
      eq(items.libraryId, sql.placeholder("libraryId")),
      itemExists(items.itemId),
    ),
  );

export function getAnnotationsByKey({
  keys,
  libraryId,
}: { keys: string[]; libraryId: number }) {
  return new Map(
    keys
      .map((key) => statement.get(v.parse(ParamsSchema, { key, libraryId })))
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.key, parseAnnotation(v)]),
  );
}
