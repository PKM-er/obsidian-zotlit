import { items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { sortByIndex } from "./_sort";
import * as v from "valibot";
import { parseAnnotation } from "./_parse";
import { buildAnnotationQuery } from "./_sql";

const ParamsSchema = v.object({
  itemId: v.number(),
});

const statement = buildAnnotationQuery()
  .where(
    and(eq(items.itemId, sql.placeholder("itemId")), itemExists(items.itemId)),
  )
  .prepare();

export function getAnnotationsById({ items }: { items: { itemId: number }[] }) {
  return new Map(
    items
      .map(({ itemId }) => statement.get(v.parse(ParamsSchema, { itemId })))
      .filter((v) => !!v)
      .sort(sortByIndex)
      .map((v) => [v.itemId, parseAnnotation(v)]),
  );
}
