/**
 * @see https://firefox-source-docs.mozilla.org/build/buildsystem/chrome-registration.html
 */

import { toIdShort } from "../utils.js";
import type { PackageInfo } from "./parse.js";

export const parseChromeManifest = (
  tsv: string,
  info: PackageInfo,
): string[][] => {
  const list = tsv.split("\n");
  return list.map((tabSplited) => {
    const [type, ...rest] = tabSplited.split("\t");
    if (type === "skin" || type === "locale" || type === "content") {
      // replace placeholder in packagename column with defaultId
      if (rest[0] === "_") rest[0] = toIdShort(info.id);
    }
    return [type, ...rest];
  });
};

export const genChromeManifest = (manifestDefs: string[][]) => {
  return manifestDefs.map((item) => item.join("\t")).join("\n");
};

export interface ContentURIManifest {
  id?: string;
  root: string;
}

export const getContentURIDef = (
  manifestDefs: string[][],
): ContentURIManifest => {
  const contentURIRaw = manifestDefs.find((item) => item[0] === "content");
  if (!contentURIRaw) {
    throw new Error("content URI is not defined in chrome.manifest");
  }
  const [, id, root] = contentURIRaw;
  return { id: id === "_" ? undefined : id, root };
};
