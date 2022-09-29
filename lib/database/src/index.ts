import { join } from "path";
import dbWorker from "worker:./worker.ts";

export default function getDbWorker() {
  return URL.createObjectURL(new Blob([dbWorker], { type: "text/javascript" }));
}

export type {
  DbWorkerAPIWorkpool as DbWorkerAPI,
  Annotation,
  AttachmentInfo,
  LibraryInfo,
} from "./api.js";

/**
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L42-L45
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L99-L112
 */
export const getCacheImagePath = (
  { groupID, key: annoKey }: { groupID: number | null; key: string },
  dataDir: string,
) => {
  const parts = [dataDir, "cache"];
  if (!groupID) {
    parts.push("library");
  } else {
    parts.push("groups", groupID.toString());
  }
  return join(...parts, annoKey + ".png");
};

/**
 * compare sortIndex in format of '123|455|789'
 */
export const sortBySortIndex = (a: string, b: string) => {
  const aIdx = a.split("|"),
    bIdx = b.split("|");
  for (let i = 0; i < aIdx.length; i++) {
    if (aIdx[i] !== bIdx[i]) {
      return parseInt(aIdx[i]) - parseInt(bIdx[i]);
    }
  }
  return 0;
};

export * from "db-types";
