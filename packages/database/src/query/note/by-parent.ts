import { db } from "@/db/zotero";
import { itemNotes as notes, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { itemColumns, noteColumns } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  parentItemId: v.number(),
});

const statement = db
  .select({
    ...noteColumns,
    ...itemColumns,
  })
  .from(notes)
  .innerJoin(items, eq(notes.itemId, items.itemId))
  .where(
    and(
      eq(notes.parentItemId, sql.placeholder("parentItemId")),
      itemExists(items.itemId),
    ),
  );

export function getNotesByParentItem({
  parentItemId,
}: { parentItemId: number }) {
  return statement.all(v.parse(ParamsSchema, { parentItemId })).map((v) => v);
}
