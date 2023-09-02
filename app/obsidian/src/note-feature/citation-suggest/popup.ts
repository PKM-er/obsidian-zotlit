import type { Editor, TFile } from "obsidian";
import { openModal } from "@/components/basic/modal";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest";
import type ZoteroPlugin from "@/zt-main";
import { insertCitation, isShift } from "./basic";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to insert Markdown citation" },
  { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

class CitationPopupSuggest extends ZoteroItemPopupSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
}

export async function insertCitationTo(
  editor: Editor,
  file: TFile | null,
  plugin: ZoteroPlugin,
) {
  const result = await chooseLiterature(plugin);
  if (!result) return false;
  const cursor = editor.getCursor();
  await insertCitation(
    { item: result.value.item, alt: isShift(result.evt) },
    {
      start: cursor,
      end: cursor,
      editor,
      file,
    },
    plugin.templateRenderer,
  );
  return true;
}

export async function chooseLiterature(plugin: ZoteroPlugin) {
  const result = await openModal(new CitationPopupSuggest(plugin));
  return result;
}
