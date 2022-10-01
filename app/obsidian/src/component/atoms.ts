import { dirname } from "path";
import { sortBySortIndex } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import type { Atom, Getter, PrimitiveAtom } from "jotai";
import { useAtomValue, atom } from "jotai";
import { atomWithDefault } from "jotai/utils";
import { useMemo } from "react";
import log from "../logger";
import type ZoteroPlugin from "../zt-main";

// Provider
export const pluginAtom = atom<ZoteroPlugin>(null as never),
  /** update when active leaf changes */
  statusAtom = atom<Status>({ type: "inactive" }),
  activeDocAtom = atom(
    (get) => {
      const status = get(statusAtom);
      return status.type === "active" ? status.doc : null;
    },
    (get, set, doc: string | null) => {
      set(
        statusAtom,
        doc === null ? { type: "inactive" } : { type: "active", doc: doc },
      );
    },
  );

// https://github.com/pmndrs/jotai/issues/71#issuecomment-701148885
export const refreshAtom = atom(
  (get) => get(statusAtom).type === "refresh",
  async (get, set) => {
    const { db } = get(pluginAtom);
    const prevStatus = get(statusAtom);
    set(statusAtom, { type: "refresh" });
    await db.refreshDatabases();
    set(statusAtom, prevStatus);
    // index refresh should be non blocking
    db.refreshIndex();
  },
);

type Status = StatusActive | StatusInactive | StatusRefresh;
interface StatusActive {
  type: "active";
  doc: string;
}
interface StatusRefresh {
  type: "refresh";
}

interface StatusInactive {
  type: "inactive";
}

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
  if (attachmentId === null) return null;
  const { db } = get(pluginAtom);
  return (await db.getAnnotations(attachmentId)).sort((a, b) =>
    sortBySortIndex(a.sortIndex, b.sortIndex),
  );
};

/** annotations atom */
export const annotsAtom = atom(fetchAnnots);

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

/** attachments atom */
export const atchIdAtom = atomWithDefault<number | null>((get) => {
  const attachments = get(attachmentsAtom);
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
export const attachmentsAtom = atom(async (get) => {
  const docKey = get(docKeyAtom);
  // no active note for literature
  if (!docKey) return null;
  const plugin = get(pluginAtom);
  const item = await plugin.db.getItem(docKey);
  if (!item || !item.itemID) return null;
  log.debug("fetching attachments for", docKey);
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
