import { atom } from "jotai";
import { annotsAtom, fetchAnnots } from "./annotation";
import { attachmentsAtom, getAttachments } from "./attachment";
import { pluginAtom } from "./obsidian";

export const manualRefreshAtom = atom(null, async (get, set) => {
  const { db } = get(pluginAtom);
  await db.initDbConnection();
  set(attachmentsAtom, await getAttachments(get));
  set(annotsAtom, await fetchAnnots(get));
  // don't trigger index refresh
});
