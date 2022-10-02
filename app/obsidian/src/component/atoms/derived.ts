import { getCacheImagePath } from "@obzt/database";
import { AnnotationType, getBacklink } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import type { AnnotAtom } from "./annotation";
import { selectedItemsAtom } from "./annotation";
import { zoteroDataDirAtom } from "./obsidian";

export const getColorAtom = (annot: AnnotAtom) =>
  selectAtom(annot, (annot) => annot.color ?? undefined);
export const getTypeAtom = (annot: AnnotAtom) =>
  selectAtom(annot, (annot) => annot.type);
export const getPageAtom = (annot: AnnotAtom) =>
  selectAtom(annot, (annot) => annot.pageLabel);
export const getCommentAtom = (annot: AnnotAtom) =>
  selectAtom(annot, (annot) => annot.comment);

export const getBacklinkAtom = (annot: AnnotAtom) =>
  selectAtom(annot, (annot) => getBacklink(annot));

export const getImgSrcAtom = (annot: AnnotAtom) =>
  atom((get) => {
    const path = getCacheImagePath(get(annot), get(zoteroDataDirAtom));
    return `app://local${path}`;
  });
export const getImgAltAtom = (annot: AnnotAtom) =>
  selectAtom(
    annot,
    ({ text, pageLabel }) => text ?? `Area Excerpt for Page ${pageLabel}`,
  );
export const getTextAtom = (annot: AnnotAtom) =>
  selectAtom(annot, ({ text }) => {
    return text && text.length > 100
      ? text.substring(0, 100) + "..."
      : text ?? "";
  });
export const getIconAtom = (annot: AnnotAtom) =>
  selectAtom(annot, ({ type }) => {
    switch (type) {
      case AnnotationType.highlight:
        return "align-left";
      case AnnotationType.image:
        return "box-select";
      case AnnotationType.note:
      case AnnotationType.ink:
        return "file-question";
      default:
        assertNever(type);
    }
  });

export const getIsSelectedAtom = (annot: AnnotAtom) =>
  atom(
    (get) => {
      const { itemID } = get(annot);
      if (!itemID) return false;
      return get(selectedItemsAtom).has(itemID);
    },
    (get, set) => {
      const items = get(selectedItemsAtom);
      const { itemID } = get(annot);
      if (!itemID) return;
      if (items.has(itemID)) {
        set(
          selectedItemsAtom,
          (items) => (items.delete(itemID), new Set([...items])),
        );
      } else {
        set(
          selectedItemsAtom,
          (items) => (items.add(itemID), new Set([...items])),
        );
      }
    },
  );
