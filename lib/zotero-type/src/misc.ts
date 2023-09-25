export enum AnnotationType {
  highlight = 1,
  note = 2,
  image = 3,
  ink = 4,
  underline = 5,
}

export interface AnnotationPosition {
  pageIndex: number;
  rects: [number, number, number, number][];
}

export type LibraryType = "user" | "group";
export type BooleanInt = 0 | 1;

export enum TagType {
  /**
   * 0 or missing indicates a manually added tag
   */
  manual = 0,
  /**
   * 1 indicates an automatically fetched tag
   */
  auto = 1,
}

/**
 * Zotero.Attachments.linkModeToName
 */
export enum AttachmentType {
  importedFile = 0,
  importedUrl = 1,
  linkedFile = 2,
  linkedUrl = 3,
  embeddedImage = 4,
}

export enum CreatorFieldMode {
  fullName = 0,
  /** store in last name */
  nameOnly = 1,
}
