import type ZoteroPlugin from "@/zt-main";
import { AnnotationView, annotViewType } from "./annot-view/view";
import { NoteFieldsView, noteFieldsViewType } from "./note-fields/view";
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
  plugin.registerView(
    noteFieldsViewType,
    (leaf) => new NoteFieldsView(leaf, plugin),
  );
  plugin.addCommand({
    id: "zotero-annot-view",
    name: "Open Zotero Annotation View in Side Panel",
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
  plugin.addCommand({
    id: "zotero-note-fields",
    name: "Open Literature Note Fields in Side Panel",
    callback: () => {
      app.workspace.ensureSideLeaf(noteFieldsViewType, "right", {
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
