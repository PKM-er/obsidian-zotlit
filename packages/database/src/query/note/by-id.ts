import { items } from "@zt/schema";
import { and, eq, sql } from "drizzle-orm";
import { itemExists } from "../_where";
import * as v from "valibot";
import { buildNoteQuery } from "./_sql";
import { parseNote } from "./_parse";

const ParamsSchema = v.object({
  itemId: v.number(),
});

const statement = buildNoteQuery()
  .where(
    and(eq(items.itemId, sql.placeholder("itemId")), itemExists(items.itemId)),
  )
  .prepare();

export function getNotesById({ items }: { items: { itemId: number }[] }) {
  return new Map(
    items
      .map(({ itemId }) => statement.get(v.parse(ParamsSchema, { itemId })))
      .filter((v) => !!v)
      .map((v) => [v.itemId, parseNote(v)]),
  );
}
