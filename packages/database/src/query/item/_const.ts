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
