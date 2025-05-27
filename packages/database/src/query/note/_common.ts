import { itemNotes as notes, items as libraryItems } from "@zt/schema";
import { pick } from "@std/collections";

export const noteColumns = pick(notes, [
  "itemId",
  "parentItemId",
  "note",
  "title",
]);
export const itemColumns = pick(libraryItems, ["key", "libraryId"]);
