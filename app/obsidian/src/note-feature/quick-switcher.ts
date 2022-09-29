import { ZoteroItemSuggestModal } from "../suggester/index.js";
import type ZoteroPlugin from "../zt-main.js";
import { openOrCreateNote } from "./open-create";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to open/create literature note" },
  // { command: "shift ↵", purpose: "to insert secondary Markdown citation" },
  { command: "esc", purpose: "to dismiss" },
];

export class CitationSuggestModal extends ZoteroItemSuggestModal {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
  async goToNote(): Promise<boolean> {
    const result = await (this.promise ?? this.open());
    if (!result) return false;
    await openOrCreateNote(this.plugin, result.value.item);
    return true;
  }
}
