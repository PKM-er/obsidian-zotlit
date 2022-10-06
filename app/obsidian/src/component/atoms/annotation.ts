import { sortBySortIndex } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { atom, useAtom, useAtomValue } from "jotai";
import type { PrimitiveAtom, Getter } from "jotai";
import { atomWithDefault, selectAtom } from "jotai/utils";
import { useMemo } from "react";
import { atomFamily } from "./atom-family";
import { activeAtchIdAtom } from "./attachment";
import { pluginAtom } from "./obsidian";

export const fetchAnnots = async (get: Getter) => {
  const attachmentId = get(activeAtchIdAtom);
  if (attachmentId === null) return null;
  const { db } = get(pluginAtom);
  const annots = (await db.getAnnotations(attachmentId)).sort((a, b) =>
    sortBySortIndex(a.sortIndex, b.sortIndex),
  );
  Object.values(stateAtomFamily).forEach((family) =>
    family.filter(annots.map((a) => a.itemID)),
  );
  return annots;
};

/** annotations atom */

export const annotsAtom = atomWithDefault(fetchAnnots);

export type AnnotAtom = PrimitiveAtom<Annotation>;

const createAtomFamily = <V>(defaultVal: V) =>
  atomFamily((_item: number) => atom(defaultVal));

export const stateAtomFamily = {
  showDetails: createAtomFamily(false),
  isSelected: createAtomFamily(false),
};

export const useShowDetails = (annotAtom: AnnotAtom) => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.showDetails(get(annotAtom).itemID)),
    [annotAtom],
  );
  return useAtom(useAtomValue(myAtom));
};

export const useIsSelected = (annotAtom: AnnotAtom) => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.isSelected(get(annotAtom).itemID)),
    [annotAtom],
  );
  return useAtom(useAtomValue(myAtom));
};

export interface AnnotProps {
  annotAtom: AnnotAtom;
}

export const isCollapsedAtom = atom(true);
