import { db } from "@/db/zotero";
import { itemNotes as notes, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { itemColumns, noteColumns } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  itemId: v.number(),
});

const statement = db
  .select({
    ...noteColumns,
    ...itemColumns,
  })
  .from(notes)
  .innerJoin(items, eq(notes.itemId, items.itemId))
  .where(
    and(eq(items.itemId, sql.placeholder("itemId")), itemExists(items.itemId)),
  );

export function getNotesById({ items }: { items: { itemId: number }[] }) {
  return new Map(
    items
      .map(({ itemId }) => statement.get(v.parse(ParamsSchema, { itemId })))
      .filter((v) => !!v)
      .map((v) => [v.itemId, v]),
  );
}
