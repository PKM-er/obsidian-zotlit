import type { AnnotationItem, AnnotationPosition, DB } from "@obzt/zotero-type";
import type { ItemIDChecked } from "../../utils/index.js";

export const select = `--sql
  items.itemID,
  items.key,
  annots.type,
  annots.authorName,
  annots.text,
  annots.comment,
  annots.color,
  annots.pageLabel,
  annots.sortIndex,
  annots.position,
  annots.isExternal
`;

export const from = `--sql
  itemAnnotations annots
  JOIN items USING (itemID)
`;

export type OutputBase = {
  itemID: ItemIDChecked;
  key: DB.Items["key"];
} & Pick<
  DB.ItemAnnotations,
  | "type"
  | "authorName"
  | "text"
  | "comment"
  | "color"
  | "pageLabel"
  | "sortIndex"
  | "position"
  | "isExternal"
>;

export type Parsed<Output> = AnnotationItem<
  Omit<Output, "sortIndex" | "position"> & {
    sortIndex: number[];
    position: AnnotationPosition;
    libraryID: number;
    groupID: number | null;
  }
>;

export type WithParentItem<Output> = Output & {
  parentItemID: DB.ItemAnnotations["parentItemID"];
  /** key of parent item (commonly attachment) */
  parentItem: DB.Items["key"];
};

export const parsePosSortIndex = (position: string, sortIndex: string) => ({
  sortIndex: sortIndex?.split("|").map((s) => parseInt(s, 10)) ?? [],
  position: JSON.parse(position),
});

/** warning: alter existing object */
export const toParsed = <O extends OutputBase>(
  obj: O,
  libraryID: number,
  groupID: number | null,
): Parsed<O> =>
  Object.assign(obj, parsePosSortIndex(obj.position, obj.sortIndex), {
    libraryID,
    groupID,
    itemType: "annotation",
  } as const);
