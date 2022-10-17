import type { Annotation } from "@obzt/zotero-type";
import { TagType } from "@obzt/zotero-type";
import equal from "fast-deep-equal";
import type { PrimitiveAtom } from "jotai";
import { atom, useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import { stateAtomFamily } from "../atoms/annotation";
import { useSelector } from "../atoms/derived";
import { pluginAtom } from "../atoms/obsidian";

/** annotations atom */

// https://github.com/pmndrs/jotai/discussions/826
export const ANNOT_PREVIEW_SCOPE = Symbol("jotai-scope-annot-preview");
export const annotAtomAtom = atom<PrimitiveAtom<Annotation>>(null as never);

export const useAnnotValue = () => useSelector((v) => v, equal);

export const useShowDetails = () => {
  const myAtom = useMemo(
    () =>
      atom((get) =>
        stateAtomFamily.showDetails(get(get(annotAtomAtom)).itemID),
      ),
    [annotAtomAtom],
  );
  return useAtom(useAtomValue(myAtom, ANNOT_PREVIEW_SCOPE));
};

export const useIsSelected = () => {
  const myAtom = useMemo(
    () =>
      atom((get) => stateAtomFamily.isSelected(get(get(annotAtomAtom)).itemID)),
    [annotAtomAtom],
  );
  return useAtom(useAtomValue(myAtom, ANNOT_PREVIEW_SCOPE));
};

export const tagsAtom = atom(async (get) => {
  const { itemID } = get(get(annotAtomAtom));
  const tags = (await get(pluginAtom).db.getTags([itemID]))[itemID];
  return tags.filter((t) => t.type === TagType.manual);
});

export const annotAtom = loadable(
  atom((get) => ({
    ...get(get(annotAtomAtom)),
    tags: get(tagsAtom),
  })),
);
