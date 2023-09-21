import type { DB, NoteItem } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";

export const select = `--sql
  items.itemID,
  items.key,
  items.clientDateModified,
  items.dateAdded,
  items.dateModified,
  notes.note,
  notes.title
`;

export const from = `--sql
  itemNotes notes
  JOIN items USING (itemID)
`;

export type OutputBase = {
  itemID: ItemIDChecked;
  key: DB.Items["key"];
  clientDateModified: DB.Items["clientDateModified"];
  dateAdded: DB.Items["dateAdded"];
  dateModified: DB.Items["dateModified"];
} & Pick<DB.ItemNotes, "note" | "title">;

export type WithParentItem<Output> = Output & {
  parentItemID: DB.ItemNotes["parentItemID"];
  /** key of parent item (commonly docItem) */
  parentItem: DB.Items["key"];
};

/** warning: alter existing object */
export const toParsed = <O extends OutputBase>(
  obj: O,
  libraryID: number,
  groupID: number | null,
): Parsed<O> =>
  Object.assign(obj, {
    libraryID,
    groupID,
    itemType: "note",
  } as const);

export type Parsed<Output> = NoteItem<
  Output & {
    libraryID: number;
    groupID: number | null;
  }
>;
