import { itemNotes as notes, items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { buildNoteQuery } from "./_sql";
import * as v from "valibot";
import { parseNote } from "./_parse";

const ParamsSchema = v.object({
  parentItemId: v.number(),
});

const statement = buildNoteQuery()
  .where(
    and(
      eq(notes.parentItemId, sql.placeholder("parentItemId")),
      itemExists(items.itemId),
    ),
  )
  .prepare();

export function getNotesByParentItem({
  parentItemId,
}: { parentItemId: number }) {
  return statement.all(v.parse(ParamsSchema, { parentItemId })).map(parseNote);
}
