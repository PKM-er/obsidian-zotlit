import { itemNotes as notes, items, groups } from "@zt/schema";
import { eq } from "drizzle-orm";
import { pick } from "@std/collections";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@db/zotero";

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
      groupId: groups.groupId,
    })
    .from(notes)
    .innerJoin(items, eq(notes.itemId, items.itemId))
    .leftJoin(groups, eq(items.libraryId, groups.libraryId))
    .leftJoin(parentItems, eq(notes.parentItemId, parentItems.itemId));
}

export type NoteQueryRawResult = NonNullable<
  Awaited<ReturnType<ReturnType<typeof buildNoteQuery>["get"]>>
>;
