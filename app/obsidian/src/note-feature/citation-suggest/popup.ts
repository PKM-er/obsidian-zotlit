import type { Editor } from "obsidian";
import { insertCitation, instructions, isShift } from "./basic";
import { openModal } from "@/components/basic/modal";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest";
import type ZoteroPlugin from "@/zt-main";

class CitationPopupSuggest extends ZoteroItemPopupSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
}

export async function insertCitationTo(editor: Editor, plugin: ZoteroPlugin) {
  const result = await chooseLiterature(plugin);
  if (!result) return false;
  insertCitation(
    { item: result.value, alt: isShift(result.evt) },
    undefined,
    editor,
    plugin.templateRenderer,
  );
  return true;
}

export async function chooseLiterature(plugin: ZoteroPlugin) {
  const result = await openModal(new CitationPopupSuggest(plugin));
  return result;
}
