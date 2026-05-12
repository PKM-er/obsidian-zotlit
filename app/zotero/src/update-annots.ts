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
  const iframeWindow =
    (reader as _ZoteroTypes.ReaderInstance & {
      _iframeWindow?: typeof globalThis | null;
      _iframe?: { contentWindow?: typeof globalThis | null } | null;
      _window?: typeof globalThis | null;
    })._iframeWindow ??
    (reader as any)._iframe?.contentWindow ??
    (reader as any)._window ??
    null;
  await (
    iframeWindow as any
  )?.wrappedJSObject.viewerInstance._viewer._annotationsStore.updateAnnotations(
    Components.utils.cloneInto(annots, iframeWindow),
  );
}
