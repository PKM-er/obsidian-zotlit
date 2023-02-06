import { around } from "monkey-around";

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
