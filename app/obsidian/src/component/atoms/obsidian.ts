import { dirname } from "path";
import type { GeneralItem } from "@obzt/zotero-type";
import { atom } from "jotai";
import { RESET } from "jotai/utils";
import { getItemKeyFromFrontmatter } from "../../note-index/ztkey-file-map";
import type ZoteroPlugin from "../../zt-main";
import { annotsAtom } from "./annotation";
import { attachmentsAtom } from "./attachment";

export const pluginAtom = atom<ZoteroPlugin>(null as never);

export type DocItem = GeneralItem & {
  itemID: Exclude<GeneralItem["itemID"], null>;
};

/** update when active leaf changes */
const _activeFileAtom = atom<string | null>(null);
export const activeFileAtom = atom(
  (get) => get(_activeFileAtom),
  (get, set, activeFile: string | null) => {
    const prevFile = get(_activeFileAtom);
    if (prevFile === activeFile) return;
    const { noteIndex } = get(pluginAtom);
    // no active note for literature
    if (!activeFile || !noteIndex.isLiteratureNote(activeFile)) {
      set(_activeFileAtom, null);
      return;
    }
    set(_activeFileAtom, activeFile);
    if (prevFile !== activeFile) {
      set(attachmentsAtom, RESET);
      set(annotsAtom, RESET);
    }
  },
);
export const activeDocItemAtom = atom(async (get) => {
  const { db } = get(pluginAtom);
  const activeFile = get(_activeFileAtom);

  if (!activeFile) return null;
  const key = getItemKeyFromFrontmatter(app.metadataCache.getCache(activeFile));
  if (!key) return null;
  const item = await db.getItem(key);
  if (!item) return null;
  return item as DocItem;
});

export const zoteroDataDirAtom = atom((get) =>
  dirname(get(pluginAtom).settings.zoteroDbPath),
);
