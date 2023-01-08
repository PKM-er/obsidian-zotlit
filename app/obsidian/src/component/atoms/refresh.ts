import type { Getter, Setter } from "jotai";
import { atom } from "jotai";
import { Notice } from "obsidian";
import { annotsAtom, fetchAnnots } from "./annotation";
import { attachmentsAtom, getAttachments } from "./attachment";
import { pluginAtom } from "./obsidian";

export const manualRefreshAtom = atom(null, async (get, set) => {
  const { database } = get(pluginAtom);
  await database.openDbConn(true);
  await refresh(get, set);
  new Notice("Annotations refreshed", 500);
  // don't trigger index refresh
});

const refresh = async (get: Getter, set: Setter) => {
  set(attachmentsAtom, await getAttachments(get));
  set(annotsAtom, await fetchAnnots(get));
};

export const autoRefreshAtom = atom(null, refresh);
