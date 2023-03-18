interface UpdateAnnot {
  id: string;
  text?: string;
  color?: string;
  comment?: string;
  position?: { pageIndex: number };
}

/**
 * @see https://github.com/zotero/zotero/blob/14bb46f43421816493b10bc30d1745c5cde86484/test/tests/pdfReaderTest.js#L122-L141
 */
export async function updateAnnotations(
  reader: _ZoteroTypes.ReaderInstance,
  annots: UpdateAnnot[],
) {
  await (
    reader._iframeWindow as any
  )?.wrappedJSObject.viewerInstance._viewer._annotationsStore.updateAnnotations(
    Components.utils.cloneInto(annots, reader._iframeWindow),
  );
}
