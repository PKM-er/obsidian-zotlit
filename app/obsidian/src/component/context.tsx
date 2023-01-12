import { createContext } from "react";
import type { AnnotationView } from "../note-feature/annot-view/view";
import type ZoteroPlugin from "../zt-main";

interface ObsidianContext {
  plugin: ZoteroPlugin;
  view: AnnotationView;
}

export const Obsidian = createContext({} as ObsidianContext);
