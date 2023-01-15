import { toPage } from "@obzt/common";
import { isAnnotationItem, isRegularItemInfo } from "../item.js";

const toLibraryID = (item: { groupID: number | null }) =>
  typeof item.groupID === "number" ? `groups/${item.groupID}` : "library";

export const getBacklink = (item: unknown) => {
  let url: URL;
  if (isRegularItemInfo(item)) {
    url = new URL(`zotero://select/${toLibraryID(item)}/items/${item.key}`);
  } else if (isAnnotationItem(item)) {
    url = new URL(
      `zotero://open-pdf/${toLibraryID(item)}/items/${item.parentItem}`,
    );
    let page: number | null;
    try {
      page = toPage(item.position.pageIndex, true);
    } catch (error) {
      console.warn(error);
      page = null;
    }
    if (typeof page === "number")
      url.searchParams.append("page", page.toString());
    if (item.key) url.searchParams.append("annotation", item.key);
  } else return "";
  return url.toString();
};
