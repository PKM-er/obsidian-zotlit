import type ZoteroPlugin from "../zt-main";
import { CitationSuggestModal } from "./quick-switcher";

const registerNoteFeature = (plugin: ZoteroPlugin) => {
  plugin.addCommand({
    id: "note-quick-switcher",
    name: "Open quick switcher for literature notes",
    callback: () => {
      new CitationSuggestModal(plugin).goToNote();
    },
  });
};
export default registerNoteFeature;
