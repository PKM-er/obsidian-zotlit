import type { AnnotationPosition } from "./position";

const toLibraryID = (item: { groupId: number | null }) =>
  typeof item.groupId === "number" ? `groups/${item.groupId}` : "library";

interface AnnotationItem extends RegularItem {
  parentItemKey: string;
  position: AnnotationPosition;
}

export function getAnnotationBacklink(item: AnnotationItem) {
  const url = new URL(
    `zotero://open-pdf/${toLibraryID(item)}/items/${item.parentItemKey}`,
  );
  const pageNumber = item.position.pageIndex + 1;
  url.searchParams.append("page", pageNumber.toString());
  url.searchParams.append("annotation", item.key);
  return url;
}

interface RegularItem {
  key: string;
  groupId: number | null;
}

export function getRegularItemBacklink(item: RegularItem) {
  return new URL(`zotero://select/${toLibraryID(item)}/items/${item.key}`);
}
