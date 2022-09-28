import { join } from "path";
import dbWorker from "worker:./worker.ts";

export default function getDbWorker() {
  return URL.createObjectURL(new Blob([dbWorker], { type: "text/javascript" }));
}

export type { DbWorkerAPIWorkpool as DbWorkerAPI } from "./api.js";

/**
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L42-L45
 * @see https://github.com/zotero/zotero/blob/c13d17b5e6ca496491e926211c0e1ea7aef072ae/chrome/content/zotero/xpcom/annotations.js#L99-L112
 */
export const getCacheImagePath = (
  annoKey: string,
  library: { libraryID: number; type: string; groupID?: number },
  dataDir: string,
) => {
  const parts = [dataDir];
  if (library.type == "user") {
    parts.push("library");
  } else if (library.type == "group") {
    if (!library.groupID)
      throw new Error("groupID is missing in library " + library.libraryID);
    parts.push("groups", library.groupID.toString());
  } else {
    throw new Error(`Unexpected library type '${library.type}'`);
  }
  return join(...parts, annoKey + ".png");
};
