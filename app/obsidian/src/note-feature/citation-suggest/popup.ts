import type { Editor } from "obsidian";
import { openModal } from "@/components/basic/modal";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest";
import type ZoteroPlugin from "@/zt-main";
import { insertCitation, instructions, isShift } from "./basic";

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
    { item: result.value.item, alt: isShift(result.evt) },
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
