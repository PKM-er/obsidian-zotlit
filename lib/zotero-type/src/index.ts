// #region Type fields exports
import { allFields } from "./fields.js";

// From Zotero.ItemTypes
const primaryTypeNames = [
  "book",
  "bookSection",
  "journalArticle",
  "newspaperArticle",
  "document",
] as const;

export const primaryTypeFields = primaryTypeNames.reduce(
  (map, type) => ((map[type] = allFields[type]), map),
  {} as Pick<typeof allFields, typeof primaryTypeNames[number]>,
);
export const nonRegularItemTypes = [
  "attachment",
  "note",
  "annotation",
] as const;
export * from "./fields.js";

// #endregion

// #region Item type definitions
import type { Creator, CreatorFullName } from "./item-base.js";
import type {
  AnnotationItem as Annotation,
  AttachmentItem as Attachment,
  NoteItem as Note,
} from "./non-regular.js";
import type { RegularItem } from "./regular.js";

export type Item = RegularItem | NoteItem | AnnotationItem | AttachmentItem;
export type { Creator, Tag } from "./item-base.js";
export * from "./regular.js";

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
  importedFile = 0,
  importedUrl = 1,
  linkedFile = 2,
  linkedUrl = 3,
  embeddedImage = 4,
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

// #endregion

export const isFullName = (creator: Creator): creator is CreatorFullName => {
  return (
    (creator as CreatorFullName).firstName !== undefined ||
    (creator as CreatorFullName).lastName !== undefined
  );
};
