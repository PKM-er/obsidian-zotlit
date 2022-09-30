import { dirname } from "path";
import { sortBySortIndex } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import type { Atom, Getter, PrimitiveAtom } from "jotai";
import { useAtomValue, atom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { useMemo } from "react";
import type ZoteroPlugin from "../zt-main";

// Provider
export const pluginAtom = atom<ZoteroPlugin>(null as never),
  /** update when active leaf changes */
  activeDocAtom = atom<string | null>(null);

export const zoteroDataDirAtom = atom((get) =>
  dirname(get(pluginAtom).settings.zoteroDbPath),
);

export const docKeyAtom = atom(async (get): Promise<string | null> => {
  const { noteIndex } = get(pluginAtom),
    activeDoc = get(activeDocAtom);
  if (activeDoc && noteIndex.isLiteratureNote(activeDoc))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return noteIndex.fileKeyMap.get(activeDoc)!.key;
  else return null;
});

const fetchAnnots = async (get: Getter) => {
  const attachmentId = get(atchIdAtom);
  if (attachmentId === null) return [];
  const { db } = get(pluginAtom);
  return (await db.getAnnotations(attachmentId)).sort((a, b) =>
    sortBySortIndex(a.sortIndex, b.sortIndex),
  );
};

/** annotations atom */
const annotsAtom = atomWithDefault(fetchAnnots);
// https://github.com/pmndrs/jotai/issues/71#issuecomment-701148885
export const latestAnnotsAtom = atom(
  (get) => get(annotsAtom),
  async (get, set) => {
    const { db } = get(pluginAtom);
    await db.refreshDatabases();
    set(annotsAtom, await fetchAnnots(get));
    // don't wait for index to rebuild
    db.refreshIndex();
  },
);

export type AnnotAtom = PrimitiveAtom<Annotation>;
export interface AnnotProps {
  annotAtom: AnnotAtom;
}
export const selectedItemsAtom = atom(new Set<number>());
export const selectedAnnotsAtom = atom((get) =>
  get(latestAnnotsAtom).filter((annot) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    get(selectedItemsAtom).has(annot.itemID!),
  ),
);

/** attachments atom */
export const atchIdAtom = atomWithDefault<number | null>((get) => {
  const attachments = get(atchsAtom);
  if (attachments && attachments.length > 0) {
    return attachments[0].itemID;
  } else return null;
});
export const setAtchIdAtom = atom(
  null,
  (_get, set, evt: React.ChangeEvent<HTMLSelectElement>) => {
    set(atchIdAtom, parseInt(evt.target.value, 10));
  },
);
export const atchsAtom = atom(async (get) => {
  const docKey = get(docKeyAtom);
  // no active note for literature
  if (!docKey) return null;

  const plugin = get(pluginAtom);
  const item = await plugin.db.getItem(docKey);
  if (!item || !item.itemID) return null;
  return await plugin.db.getAttachments(item.itemID, item.libraryID);
});

export const useDerivedAtom = <V>(
  annot: AnnotAtom,
  getAtom: (annot: AnnotAtom) => Atom<V>,
) => {
  const derivedAtom = useMemo(() => getAtom(annot), [annot, getAtom]);
  return useAtomValue(derivedAtom);
};

export const createInitialValues = () => {
  const initialValues: (readonly [Atom<unknown>, unknown])[] = [];
  const get = () => initialValues;
  const set = <Value>(anAtom: Atom<Value>, value: Value) => {
    initialValues.push([anAtom, value]);
  };
  return { get, set };
};
