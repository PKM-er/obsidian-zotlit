import type { Annotation } from "@obzt/zotero-type";
import equal from "fast-deep-equal";
import type { PrimitiveAtom } from "jotai";
import { atom, useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import type { AnnotationExtra, Context } from "../../template/helper";
import { withAnnotHelper } from "../../template/helper/annot";
import { stateAtomFamily } from "../atoms/annotation";
import { activeAtchAtom } from "../atoms/attachment";
import { useSelector } from "../atoms/derived";
import { helperContextAtom, pluginAtom } from "../atoms/obsidian";
import { GLOBAL_SCOPE } from "../atoms/utils";

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
    const { itemID } = get(annotAtom);
    const tags = (await get(pluginAtom).db.getTags([itemID]))[itemID];
    return tags; // .filter((t) => t.type === TagType.manual);
  }),
  loadableTagsAtom = loadable(tagsAtom);

export const annotAtom = atom((get) => get(get(annotAtomAtom)));

export const useAnnotHelperArgs = ():
  | [Annotation, AnnotationExtra, Context]
  | null => {
  const annot = useAtomValue(annotAtom, ANNOT_PREVIEW_SCOPE),
    tags = useAtomValue(loadableTagsAtom, ANNOT_PREVIEW_SCOPE),
    attachment = useAtomValue(activeAtchAtom, GLOBAL_SCOPE),
    ctx = useAtomValue(helperContextAtom, GLOBAL_SCOPE);
  if (tags.state === "hasData" && attachment)
    return [annot, { attachment, tags: tags.data }, ctx];
  else return null;
};

export const useAnnotHelper = () => {
  const args = useAnnotHelperArgs();
  return args ? withAnnotHelper(...args) : null;
};
