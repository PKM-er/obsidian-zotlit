// https://github.com/zotero/zotero/blob/47e55286f758830c4d75c6a5f0ba7683d66d3358/chrome/content/zotero/xpcom/annotations.js#L31-L36
export enum AnnotationType {
  highlight = 1,
  note = 2,
  image = 3,
  ink = 4,
  underline = 5,
  text = 6,
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
