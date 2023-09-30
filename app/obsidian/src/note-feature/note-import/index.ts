import { join } from "path/posix";
import { modalSelect } from "@ophidian/core";
import filenamify from "filenamify/browser";
import { Notice } from "obsidian";
import { openModal } from "@/components/basic/modal";
import { ZoteroItemPopupSuggest } from "@/components/item-suggest/popup.js";
import type ZoteroPlugin from "@/zt-main.js";

const instructions = [
  { command: "↑↓", purpose: "to navigate" },
  { command: "↵", purpose: "to continue select note to import" },
  { command: "esc", purpose: "to dismiss" },
];

class NoteQuickSwitch extends ZoteroItemPopupSuggest {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin);
    this.setInstructions(instructions);
  }
}

export async function importNote(plugin: ZoteroPlugin): Promise<boolean> {
  const result = await openModal(new NoteQuickSwitch(plugin));
  if (!result) return false;
  const {
    value: { item },
  } = result;
  const notes = await plugin.databaseAPI.getNotes(
    item.itemID,
    plugin.settings.libId,
  );
  if (notes.length === 0) {
    new Notice("No note found for selected literature");
    return false;
  }
  const noteChoice = await modalSelect(
    notes,
    (n) => n.title ?? n.note?.substring(0, 20) ?? `No title (Key ${n.key})`,
  );
  if (!noteChoice.item) return false;
  const noteItem = noteChoice.item;
  if (!noteItem.note) {
    new Notice("Selected note is empty");
    return false;
  }
  const noteMarkdown = await plugin.noteParser.turndown(noteItem.note);

  const folder = plugin.settings.current?.literatureNoteFolder;

  const filepath = join(
    folder,
    "zt-import",
    filenamify(
      noteItem.title ??
        [noteItem.note.substring(0, 10), noteItem.key].join("_"),
      { replacement: "_" },
    ),
  );
  const file = await plugin.app.fileManager.createNewMarkdownFile(
    plugin.app.vault.getRoot(),
    filepath,
    noteMarkdown,
  );
  await plugin.app.workspace.openLinkText(file.path, "", true);
  new Notice(`Note imported: ${noteItem.title ?? noteItem.key}`);
  return true;
}
