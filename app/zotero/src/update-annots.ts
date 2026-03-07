interface UpdateAnnot {
  id: string;
  text?: string;
  color?: string;
  comment?: string;
  position?: { pageIndex: number };
}

/**
 * Update annotations via the reader's internal annotation store.
 * This uses deep private APIs that may not be available in all Zotero versions.
 *
 * @see https://github.com/zotero/zotero/blob/14bb46f43421816493b10bc30d1745c5cde86484/test/tests/pdfReaderTest.js#L122-L141
 */
export async function updateAnnotations(
  reader: _ZoteroTypes.ReaderInstance,
  annots: UpdateAnnot[],
) {
  try {
    // TODO: In Zotero 8+, this deep internal path may have changed.
    // If this fails, consider using the public Zotero.Items API to update annotations directly.
    await (
      reader._iframeWindow as any
    )?.wrappedJSObject.viewerInstance._viewer._annotationsStore.updateAnnotations(
      Components.utils.cloneInto(annots, reader._iframeWindow),
    );
  } catch (e) {
    throw new Error(
      "Failed to update annotations via reader internals. " +
        "This feature may not be available in this Zotero version. " +
        `Original error: ${(e as Error).message}`,
    );
  }
}
