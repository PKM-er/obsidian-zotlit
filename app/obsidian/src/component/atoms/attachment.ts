import type { GeneralItem } from "@obzt/zotero-type";
import type { Getter } from "jotai";
import { atom } from "jotai";
import { atomFamily, atomWithDefault, atomWithStorage } from "jotai/utils";
import log from "@log";
import { activeDocItemAtom, pluginAtom } from "./obsidian";

const toLocalStorageKey = (docItem: GeneralItem) =>
  `obzt-active-atch-${docItem.itemID}-${docItem.libraryID}`;
export const activeAtchIdAtomFamily = atomFamily(
  (item: GeneralItem) =>
    atomWithStorage(toLocalStorageKey(item), null as number | null),
  (a, b) => a.itemID === b.itemID && a.libraryID === b.libraryID,
);

export const activeAtchIdAtom = atom(
  (get) => get(activeAtchAtom)?.itemID ?? null,
);

export const activeAtchAtom = atom(
  (get) => {
    const docItem = get(activeDocItemAtom);
    if (!docItem) return null;
    const cachedAtchId = get(activeAtchIdAtomFamily(docItem));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const attachments = get(attachmentsAtom)!;
    if (attachments.length === 0) return null;
    let activeAtch;
    if (
      cachedAtchId !== null &&
      (activeAtch = attachments.find((a) => a.itemID === cachedAtchId))
    )
      return activeAtch;
    else return attachments[0];
  },
  async (get, set, evt: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(evt.target.value, 10);
    const docItem = get(activeDocItemAtom);
    if (!docItem) return;
    set(activeAtchIdAtomFamily(docItem), id);
  },
);

export const getAttachments = async (get: Getter) => {
  const item = get(activeDocItemAtom),
    { db } = get(pluginAtom);
  // no active note for literature
  if (!item) return null;
  log.trace("fetching attachments for", item);
  return db.getAttachments(item.itemID, item.libraryID);
};

export const attachmentsAtom = atomWithDefault(getAttachments);
