import { itemNotes as notes, items } from "@zt/schema";
import { eq } from "drizzle-orm";
import { pick } from "@std/collections";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/zotero";

const parentItems = alias(items, "parentItems");
const parentItemColumns = {
  parentItemId: parentItems.itemId,
  parentItemKey: parentItems.key,
};

const noteColumns = pick(notes, ["itemId", "parentItemId", "note", "title"]);
const itemColumns = pick(items, ["key", "libraryId"]);

export function buildNoteQuery() {
  return db
    .select({
      ...noteColumns,
      ...itemColumns,
      ...parentItemColumns,
    })
    .from(notes)
    .innerJoin(items, eq(notes.itemId, items.itemId))
    .leftJoin(parentItems, eq(notes.parentItemId, parentItems.itemId));
}

export type NoteQueryRawResult = NonNullable<
  ReturnType<ReturnType<typeof buildNoteQuery>["get"]>
>;
