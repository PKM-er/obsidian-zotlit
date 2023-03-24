import type {
  AnnotationInfo,
  AttachmentInfo,
  ItemIDLibID,
  ItemKeyLibID,
  LibraryInfo,
  RegularItemInfo,
} from "@obzt/database";

export interface PluginAPI {
  version: string;
  /**
   * Returns the annotations of an attachment.
   *
   * @param attachmentId - The ID of the attachment.
   * @param libraryID - The ID of the library containing the attachment.
   * @returns The annotations of the attachment.
   */
  getAnnotsOfAtch(
    attachmentId: number,
    libraryID: number,
  ): Promise<AnnotationInfo[]>;

  /**
   * Gets the document items from the given items. If an item is a document, then it is returned in the
   * array; otherwise, null is returned in its place.
   *
   * @param items  The item IDs or keys of the items to get the document items from.
   * @returns  The document items from the given items.
   */
  getDocItems(
    items: ItemIDLibID[] | ItemKeyLibID[],
  ): Promise<(RegularItemInfo | null)[]>;

  /**
   * Get all annotations with the given keys.
   *
   * @param {string[]} keys - The annotation keys to get.
   * @param {number} libraryID - The library ID.
   * @returns {Promise<Record<string, AnnotationInfo>>} A promise that resolves
   *   to a map of key to annotation info.
   */
  getAnnotsFromKeys(
    keys: string[],
    libraryID: number,
  ): Promise<Record<string, AnnotationInfo>>;

  getAttachments(docId: number, libraryID: number): Promise<AttachmentInfo[]>;
  getItemIDsFromCitekey(citekeys: string[]): Promise<Record<string, number>>;
  getLibs(): Promise<LibraryInfo[]>;
}
