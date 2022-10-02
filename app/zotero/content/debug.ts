const to_s = (obj: any): string => {
  if (typeof obj === "string") return obj;
  const s = `${obj}`;
  switch (s) {
    case "[object Object]":
      return JSON.stringify(obj, null, 2);
    case "[object Set]":
      return JSON.stringify(Array.from(obj, null, 2));
    default:
      return s;
  }
};

export const format = (...msg) => {
  return `ObsidianNote: ${msg.map(to_s).join(" ")}`;
};

export const debug = (...msg): void => {
  Zotero.log(format(msg));
};
