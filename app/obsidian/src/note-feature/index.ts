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
    callback: async () => {
      const existing = app.workspace.getLeavesOfType(annotViewType);
      if (existing.length) {
        app.workspace.revealLeaf(existing[0]);
        return;
      }
      const leaf = app.workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: annotViewType,
        active: true,
      });
      app.workspace.revealLeaf(leaf);
    },
  });
};
export default registerNoteFeature;
