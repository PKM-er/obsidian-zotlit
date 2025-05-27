import { items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import { buildNoteQuery } from "./_sql";
import * as v from "valibot";
import { parseNote } from "./_parse";

const ParamsSchema = v.object({
  key: v.string(),
  libraryId: v.number(),
});

const statement = buildNoteQuery()
  .where(
    and(
      eq(items.key, sql.placeholder("key")),
      eq(items.libraryId, sql.placeholder("libraryId")),
      itemExists(items.itemId),
    ),
  )
  .prepare();

export function getNotesByKey({
  keys,
  libraryId,
}: { keys: string[]; libraryId: number }) {
  return new Map(
    keys
      .map((key) => statement.get(v.parse(ParamsSchema, { key, libraryId })))
      .filter((v) => !!v)
      .map((v) => [v.key, parseNote(v)]),
  );
}
