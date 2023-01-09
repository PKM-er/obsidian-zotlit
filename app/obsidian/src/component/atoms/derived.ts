import type { AnnotationInfo } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import assertNever from "assert-never";
import { useAtomValue, atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { useMemo } from "react";
import { annotAtomAtom, ANNOT_PREVIEW_SCOPE } from "../annot-preview/atom";
import { pluginAtom } from "./obsidian";

export const useSelector = <Slice>(
  selector: (v: Awaited<AnnotationInfo>) => Slice,
  equalityFn?: (a: Slice, b: Slice) => boolean,
) => {
  const atom = useAtomValue(annotAtomAtom, ANNOT_PREVIEW_SCOPE);
  const derivedAtom = useMemo(
    () => selectAtom(atom, selector, equalityFn),
    [atom],
  );
  return useAtomValue(derivedAtom);
};

export const getColor = ({ color }: AnnotationInfo) => color ?? undefined;

export const imgSrcAtom = atom(
  (get) =>
    `app://local${getCacheImagePath(
      get(get(annotAtomAtom)),
      get(pluginAtom).settings.database.zoteroDataDir,
    )}`,
);

export const getIcon = ({ type }: AnnotationInfo) => {
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
