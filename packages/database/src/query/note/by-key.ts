import { db } from "@/db/zotero";
import { itemNotes as notes, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { itemColumns, noteColumns } from "./_common";
import * as v from "valibot";

const ParamsSchema = v.object({
  key: v.string(),
  libraryId: v.number(),
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
      eq(items.key, sql.placeholder("key")),
      eq(items.libraryId, sql.placeholder("libraryId")),
      itemExists(items.itemId),
    ),
  );

export function getNotesByKey({
  keys,
  libraryId,
}: { keys: string[]; libraryId: number }) {
  return new Map(
    keys
      .map((key) => statement.get(v.parse(ParamsSchema, { key, libraryId })))
      .filter((v) => !!v)
      .map((v) => [v.key, v]),
  );
}
