import { getCacheImagePath } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import type { Atom } from "jotai";
import { useAtomValue, atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { useMemo } from "react";
import { annotAtom } from "../annot-preview/atom";
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

export const imgSrcAtom = atom(
  (get) =>
    `app://local${getCacheImagePath(get(annotAtom), get(zoteroDataDirAtom))}`,
);

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
