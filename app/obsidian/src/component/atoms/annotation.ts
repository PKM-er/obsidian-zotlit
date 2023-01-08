import { sortBySortIndex } from "@obzt/database";
import { atom } from "jotai";
import type { Getter } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { atomFamily } from "./atom-family";
import { activeAtchIdAtom } from "./attachment";
import { pluginAtom } from "./obsidian";

export const fetchAnnots = async (get: Getter) => {
  const attachmentId = get(activeAtchIdAtom);
  if (attachmentId === null) return null;
  const { database } = get(pluginAtom);
  const annots = (
    await database.api.getAnnotations(
      attachmentId,
      database.settings.citationLibrary,
    )
  ).sort((a, b) => sortBySortIndex(a.sortIndex, b.sortIndex));
  Object.values(stateAtomFamily).forEach((family) =>
    family.filter(annots.map((a) => a.itemID)),
  );
  return annots;
};

/** annotations atom */

export const annotsAtom = atomWithDefault(fetchAnnots);

const createAtomFamily = <V>(defaultVal: V) =>
  atomFamily((_item: number) => atom(defaultVal));

export const stateAtomFamily = {
  showDetails: createAtomFamily(false),
  isSelected: createAtomFamily(false),
};

export const isCollapsedAtom = atom(false);
