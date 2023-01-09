import type { RegularItemInfo } from "@obzt/database";
import { atom } from "jotai";
import { loadable, RESET } from "jotai/utils";
import { getItemKeyFromFrontmatter } from "../../note-index/ztkey-file-map";
import type { Context } from "../../template/helper";
import type ZoteroPlugin from "../../zt-main";
import { annotsAtom } from "./annotation";
import { attachmentsAtom } from "./attachment";

export const helperContextAtom = atom<Context>((get) => ({
  plugin: get(pluginAtom),
  sourcePath: get(activeFileAtom),
}));

export const pluginAtom = atom<ZoteroPlugin>(null as never);

export type DocItem = RegularItemInfo & {
  itemID: Exclude<RegularItemInfo["itemID"], null>;
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
    // trigger full refresh for new file
    if (prevFile !== activeFile) {
      set(attachmentsAtom, RESET);
      set(annotsAtom, RESET);
    }
  },
);
export const activeDocItemAtom = atom(async (get) => {
  const { database } = get(pluginAtom);
  const activeFile = get(_activeFileAtom);

  if (!activeFile) return null;
  const key = getItemKeyFromFrontmatter(app.metadataCache.getCache(activeFile));
  if (!key) return null;
  const item = await database.api.getItem(
    key,
    database.settings.citationLibrary,
  );
  if (!item) return null;
  return item as DocItem;
});

export const tagsAtom = atom(async (get) => {
    const item = get(activeDocItemAtom);
    if (!item) return null;
    const { itemID } = item;
    const { database } = get(pluginAtom);
    const tags = (
      await database.api.getTags([itemID], database.settings.citationLibrary)
    )[itemID];
    return tags; // .filter((t) => t.type === TagType.manual);
  }),
  loadableTagsAtom = loadable(tagsAtom);
