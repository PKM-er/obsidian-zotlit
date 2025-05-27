export const CreatorFieldMode = {
  fullName: 0,
  /** store in last name */
  nameOnly: 1,
} as const;

/**
 * Zotero.Attachments.linkModeToName
 */

export const AttachmentLinkMode = {
  importedFile: 0,
  importedUrl: 1,
  linkedFile: 2,
  linkedUrl: 3,
  embeddedImage: 4,
} as const;

export const AnnotationType = {
  highlight: 1,
  note: 2,
  image: 3,
  ink: 4,
  underline: 5,
  text: 6,
} as const;

export const TagType = {
  /**
   * 0 or missing indicates a manually added tag
   */
  manual: 0,
  /**
   * 1 indicates an automatically fetched tag
   */
  auto: 1,
} as const;
