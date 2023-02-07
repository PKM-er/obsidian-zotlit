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
  const result = await openModal(new CitationPopupSuggest(plugin));
  if (!result) return false;
  const {
    value: { item },
    evt,
  } = result;
  insertCitation(
    { item, alt: isShift(evt) },
    undefined,
    editor,
    plugin.templateRenderer,
  );
  return true;
}
