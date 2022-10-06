import { getCacheImagePath } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import type { Atom, Getter, Setter } from "jotai";
import { useAtom, useAtomValue, atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { useMemo } from "react";
import type { AnnotAtom } from "./annotation";
import { selectedItemsAtom } from "./annotation";
import { zoteroDataDirAtom } from "./obsidian";

export const useSelector = <Value, Slice>(
  anAtom: Atom<Value>,
  selector: (v: Awaited<Value>) => Slice,
  equalityFn?: (a: Slice, b: Slice) => boolean,
) => {
  const atom = useMemo(
    () => selectAtom(anAtom, selector, equalityFn),
    [anAtom],
  );
  return useAtomValue(atom);
};

export const getColor = ({ color }: Annotation) => color ?? undefined;

export const useImgSrc = (annotAtom: AnnotAtom) => {
  const imgsrcAtom = useMemo(
    () =>
      atom(
        (get) =>
          `app://local${getCacheImagePath(
            get(annotAtom),
            get(zoteroDataDirAtom),
          )}`,
      ),
    [annotAtom],
  );
  return useAtomValue(imgsrcAtom);
};

export const getIcon = ({ type }: Annotation) => {
  switch (type) {
    case AnnotationType.highlight:
      return "align-left";
    case AnnotationType.image:
      return "frame";
    case AnnotationType.note:
    case AnnotationType.ink:
      return "file-question";
    default:
      assertNever(type);
  }
};

export const useIsSelectedAnnot = (annotAtom: AnnotAtom) => {
  const isSelectedAtom = useMemo(() => {
    const getter = (get: Getter) => {
      const { itemID } = get(annotAtom);
      if (!itemID) return false;
      return get(selectedItemsAtom).has(itemID);
    };
    const setter = (get: Getter, set: Setter) => {
      const items = get(selectedItemsAtom);
      const { itemID } = get(annotAtom);
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
    };
    return atom(getter, setter);
  }, [annotAtom]);
  return useAtom(isSelectedAtom);
};
