import { Keymap } from "obsidian";
import { openModal } from "@/components/basic/modal";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest/popup.js";
import type ZoteroPlugin from "@/zt-main.js";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to open/create literature note" },
  // { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

class NoteQuickSwitch extends ZoteroItemPopupSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
}

export async function openOrCreateNote(plugin: ZoteroPlugin): Promise<boolean> {
  const result = await openModal(new NoteQuickSwitch(plugin));
  if (!result) return false;
  const {
    value: { item },
    evt,
  } = result;
  if (await plugin.noteFeatures.openNote(item, true)) return true;
  const notePath = await plugin.noteFeatures.createNoteForDocItemFull(item);
  await plugin.app.workspace.openLinkText(
    notePath,
    "",
    Keymap.isModEvent(evt),
    { active: true },
  );
  return true;
}
