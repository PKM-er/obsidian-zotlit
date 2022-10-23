import { toPage } from "@obzt/common";
import type { Annotation, GeneralItem, Item } from "./item.js";
import { nonRegularItemTypes } from "./item.js";
import log from "./logger.js";

export const isGeneralItem = (item: unknown): item is GeneralItem =>
  !nonRegularItemTypes.includes((item as Item).itemType as never) &&
  typeof (item as Item).key === "string";
export const isAnnotationItem = (item: unknown): item is Annotation =>
  (item as Item).itemType === "annotation" && !!(item as Annotation).parentItem;

const toLibraryID = (item: { groupID: number | null }) =>
  typeof item.groupID === "number" ? `groups/${item.groupID}` : "library";

export const getBacklink = (item: unknown) => {
  let url: URL;
  if (isGeneralItem(item)) {
    url = new URL(`zotero://select/${toLibraryID(item)}/items/${item.key}`);
  } else if (isAnnotationItem(item)) {
    url = new URL(
      `zotero://open-pdf/${toLibraryID(item)}/items/${item.parentItem}`,
    );
    let page: number | null;
    try {
      page = toPage(item.position.pageIndex, true);
    } catch (error) {
      log.warn(error);
      page = null;
    }
    if (typeof page === "number")
      url.searchParams.append("page", page.toString());
    if (item.key) url.searchParams.append("annotation", item.key);
  } else return "";
  return url.toString();
};
