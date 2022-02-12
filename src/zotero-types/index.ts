//#region Type fields exports
import { Fields, ItemTypes } from "./fields";

// From Zotero.ItemTypes
const primaryTypeNames = [
  "book",
  "bookSection",
  "journalArticle",
  "newspaperArticle",
  "document",
] as const;

export const PrimaryTypeFields = primaryTypeNames.reduce(
  (map, type) => ((map[type] = Fields[type]), map),
  {} as Pick<typeof Fields, typeof primaryTypeNames[number]>,
);
export const NonRegularItemTypes = [
  "attachment",
  "note",
  "annotation",
] as const;
export { Fields as AllFields, ItemTypes as AllItemTypes };

//#endregion

//#region Item type definitions
import {
  AnnotationItem as Annotation,
  AttachmentItem as Attachment,
  NoteItem as Note,
  RegularItem as RegularItemSrc,
} from "./fields";

export type RegularItem = RegularItemSrc & {
  citekey?: string;
};

export type Item = RegularItem | NoteItem | AnnotationItem | AttachmentItem;

// Zotero.Items._loadAnnotations
enum AnnotationType {
  highlight = 1,
  note = 2,
  image = 3,
  ink = 4,
}
export type AnnotationItem = Annotation & {
  parentItem: string;
  annotationType: keyof typeof AnnotationType;
  annotationText: string;
  annotationComment: string;
  annotationColor: string;
  annotationPageLabel: string;
  annotationSortIndex: string;
  /** json string */
  annotationPosition: {
    pageIndex: number;
    rects: [number, number, number, number][];
  };
};

// Zotero.Attachments.linkModeToName
enum AttachmentType {
  imported_file = 0,
  imported_url = 1,
  linked_file = 2,
  linked_url = 3,
  embedded_image = 4,
}

export type AttachmentItem = Attachment & {
  parentItem?: string;
  linkMode: keyof typeof AttachmentType;
  charset: string;
  filename: string;
};

export type NoteItem = Note & {
  /** html */
  note: string;
};

//#endregion
