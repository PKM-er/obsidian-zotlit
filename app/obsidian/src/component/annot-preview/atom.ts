import { get } from "http";
import type { Annotation } from "@obzt/zotero-type";
import { TagType } from "@obzt/zotero-type";
import { atom, useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import { stateAtomFamily } from "../atoms/annotation";
import { pluginAtom } from "../atoms/obsidian";

/** annotations atom */

export const annotBaseAtom = atom({} as Annotation);

export const useShowDetails = () => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.showDetails(get(annotBaseAtom).itemID)),
    [annotBaseAtom],
  );
  return useAtom(useAtomValue(myAtom));
};

export const useIsSelected = () => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.isSelected(get(annotBaseAtom).itemID)),
    [annotBaseAtom],
  );
  return useAtom(useAtomValue(myAtom));
};

export const tagsAtom = atom(async (get) =>
  (await get(pluginAtom).db.getTags([get(annotBaseAtom).itemID])).filter(
    (t) => t.type === TagType.manual,
  ),
);

export const annotAtom = loadable(
  atom((get) => ({
    ...get(annotBaseAtom),
    tags: get(tagsAtom),
  })),
);
