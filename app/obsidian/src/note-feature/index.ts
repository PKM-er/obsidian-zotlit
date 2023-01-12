import type ZoteroPlugin from "../zt-main";
import { AnnotationView, annotViewType } from "./annot-view/view";
import { CitationSuggestModal } from "./quick-switcher";

const registerNoteFeature = (plugin: ZoteroPlugin) => {
  plugin.addCommand({
    id: "note-quick-switcher",
    name: "Open quick switcher for literature notes",
    callback: () => {
      new CitationSuggestModal(plugin).goToNote();
    },
  });
  plugin.registerView(
    annotViewType,
    (leaf) => new AnnotationView(leaf, plugin),
  );
  plugin.addCommand({
    id: "zotero-annot-view",
    name: "Open Zotero Annotation Side Panel",
    callback: () => {
      app.workspace.ensureSideLeaf(annotViewType, "right", {
        active: true,
        /**
         * Workaroud to make sure view shows active file when first open
         * TODO: bug report? replicate in Backlink, Outline etc...
         */
        state: { file: app.workspace.getActiveFile()?.path },
      });
    },
  });
};
export default registerNoteFeature;
