import type { Annotation } from "@obzt/zotero-type";
import { atom, useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";
import { stateAtomFamily } from "../atoms/annotation";

/** annotations atom */

export const annotAtom = atom({} as Annotation);

export const useShowDetails = () => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.showDetails(get(annotAtom).itemID)),
    [annotAtom],
  );
  return useAtom(useAtomValue(myAtom));
};

export const useIsSelected = () => {
  const myAtom = useMemo(
    () => atom((get) => stateAtomFamily.isSelected(get(annotAtom).itemID)),
    [annotAtom],
  );
  return useAtom(useAtomValue(myAtom));
};
