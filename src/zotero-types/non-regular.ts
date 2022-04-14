import { ItemBase } from "./item-base";
export type AttachmentItem = ItemBase &
  Record<"itemType", "attachment"> &
  Partial<Record<"title" | "url", string> & Record<"accessDate", Date>>;
export type NoteItem = ItemBase & Record<"itemType", "note">;
export type AnnotationItem = ItemBase & Record<"itemType", "annotation">;
