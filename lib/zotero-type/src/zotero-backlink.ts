import { toPage } from "@obzt/common";
import type { Annotation, GeneralItem, Item } from "./item";
import { nonRegularItemTypes } from "./item";
import log from "./logger";
import type { AnnotationPosition } from "./misc";

export const isGeneralItem = (item: unknown): item is GeneralItem =>
  !nonRegularItemTypes.includes((item as Item).itemType as never) &&
  typeof (item as Item).key === "string";
export const isAnnotationItem = (item: unknown): item is Annotation =>
  (item as Item).itemType === "annotation" && !!(item as Annotation).parentItem;

export const getBacklink = (item: GeneralItem | Annotation) => {
  let url: URL;
  const library =
    typeof item.groupID === "number" ? `groups/${item.groupID}` : "library";
  if (isGeneralItem(item)) {
    url = new URL(`zotero://select/${library}/items/${item.key}`);
  } else if (isAnnotationItem(item)) {
    url = new URL(`zotero://open-pdf/${library}/items/${item.parentItem}`);
    let page: number | null;
    try {
      const position = JSON.parse(item.position) as AnnotationPosition;
      page = toPage(position.pageIndex);
    } catch (error) {
      log.warn(error);
      page = null;
    }
    if (page) url.searchParams.append("page", page.toString());
    if (item.key) url.searchParams.append("annotation", item.key);
  } else return "";
  return url.toString();
};
