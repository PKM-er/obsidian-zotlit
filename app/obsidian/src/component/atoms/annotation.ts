import { sortBySortIndex } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { atom } from "jotai";
import type { PrimitiveAtom, Getter } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { activeAtchIdAtom } from "./attachment";
import { pluginAtom } from "./obsidian";

export const fetchAnnots = async (get: Getter) => {
  const attachmentId = get(activeAtchIdAtom);
  if (attachmentId === null) return null;
  const { db } = get(pluginAtom);
  return (await db.getAnnotations(attachmentId)).sort((a, b) =>
    sortBySortIndex(a.sortIndex, b.sortIndex),
  );
};

/** annotations atom */

export const annotsAtom = atomWithDefault(fetchAnnots);

export type AnnotAtom = PrimitiveAtom<Annotation>;
export interface AnnotProps {
  annotAtom: AnnotAtom;
}
export const selectedItemsAtom = atom(new Set<number>());
export const selectedAnnotsAtom = atom(
  (get) =>
    get(annotsAtom)?.filter((annot) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      get(selectedItemsAtom).has(annot.itemID!),
    ) ?? null,
);

export const isCollapsedAtom = atom(true);
