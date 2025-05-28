import { items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { sortByIndex } from "./_sort";
import * as v from "valibot";
import { buildAnnotationQuery } from "./_sql";
import { parseAnnotation } from "./_parse";

const ParamsSchema = v.object({
  key: v.string(),
  libraryId: v.number(),
});

const statement = buildAnnotationQuery()
  .where(
    and(
      eq(items.key, sql.placeholder("key")),
      eq(items.libraryId, sql.placeholder("libraryId")),
      itemExists(items.itemId),
    ),
  )
  .prepare();

export async function getAnnotationsByKey({
  keys,
  libraryId,
}: { keys: string[]; libraryId: number }) {
  return new Map(
    (
      await Promise.all(
        keys.map((key) =>
          statement.get(v.parse(ParamsSchema, { key, libraryId })),
        ),
      )
    )
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.key, parseAnnotation(v)]),
  );
}
