import type { Getter, Setter } from "jotai";
import { atom } from "jotai";
import { annotsAtom, fetchAnnots } from "./annotation";
import { attachmentsAtom, getAttachments } from "./attachment";
import { pluginAtom } from "./obsidian";

export const manualRefreshAtom = atom(null, async (get, set) => {
  const { db } = get(pluginAtom);
  await db.openDbConn(true);
  await refresh(get, set);
  // don't trigger index refresh
});

const refresh = async (get: Getter, set: Setter) => {
  set(attachmentsAtom, await getAttachments(get));
  set(annotsAtom, await fetchAnnots(get));
};

export const autoRefreshAtom = atom(null, refresh);
