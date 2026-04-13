import { around } from "monkey-around";

type ReaderWithInternals = _ZoteroTypes.ReaderInstance & {
  _iframeWindow?: typeof globalThis | null;
  _iframe?: { contentWindow?: typeof globalThis | null } | null;
  _window?: typeof globalThis | null;
  _popupset?: Element | null;
  popupset?: Element | null;
};

type ReaderManager = _ZoteroTypes.Reader & {
  _readers?: _ZoteroTypes.ReaderInstance[];
  readers?: _ZoteroTypes.ReaderInstance[];
};

export const onReaderOpen = (
  reader: _ZoteroTypes.Reader,
  breakOn: (reader: _ZoteroTypes.Reader) => boolean,
) => {
  const unload = around(reader, {
    open: (next) =>
      function (this: _ZoteroTypes.Reader, ...args) {
        const result = next.apply(this, args);
        if (breakOn(this)) unload();
        return result;
      },
  });
  return unload;
};

export const getReaderInstances = (
  reader: _ZoteroTypes.Reader,
): _ZoteroTypes.ReaderInstance[] => {
  const manager = reader as ReaderManager;
  const instances = manager._readers ?? manager.readers;
  return Array.isArray(instances) ? instances : [];
};

export const getReaderPrototype = (
  reader: _ZoteroTypes.Reader,
): _ZoteroTypes.ReaderInstance | undefined => {
  return getReaderInstances(reader)[0]?.constructor?.prototype;
};

export const getReaderIframeWindow = (
  reader: _ZoteroTypes.ReaderInstance,
): typeof globalThis | null => {
  const instance = reader as ReaderWithInternals;
  return (
    instance._iframeWindow ??
    instance._iframe?.contentWindow ??
    instance._window ??
    null
  );
};

export const getReaderPopupset = (
  reader: _ZoteroTypes.ReaderInstance,
): Element | null => {
  const instance = reader as ReaderWithInternals;
  return instance._popupset ?? instance.popupset ?? null;
};
