import { MarkdownView, TFile } from "obsidian";
import type { ItemWithAnnots } from "../note-template/const.js";

import type ZoteroPlugin from "../zt-main.js";
import { createNote } from "./open-create.js";

export const importAnnotation = async (
  plugin: ZoteroPlugin,
  data: ItemWithAnnots,
) => {
  const { vault, workspace } = plugin.app,
    { literatureNoteTemplate: template } = plugin.settings;

  const open = (file: TFile, newLeaf = false) =>
    workspace.openLinkText(file.path, "", newLeaf);

  const info = plugin.noteIndex.getNoteFromKey(data);
  const noteFile = info && plugin.app.vault.getAbstractFileByPath(info.file);
  if (noteFile && noteFile instanceof TFile) {
    // insert into existing note
    const annots = data.annotations
        ? template.render("annots", data.annotations)
        : "",
      view = workspace.getActiveViewOfType(MarkdownView);
    if (!annots) return;
    if (view && view.file.path === noteFile.path) {
      const { editor } = view;
      if (editor.somethingSelected()) {
        editor.replaceSelection(annots);
      } else {
        // insert at the end of the file
        editor.replaceRange("\n" + annots, { line: Infinity, ch: Infinity });
      }
    } else {
      let content = await vault.read(noteFile);
      // append annotations to the bottom of the note
      content += annots;
      await vault.modify(noteFile, content);
      open(noteFile);
    }
  } else {
    // create new note and open
    open(await createNote(plugin, data));
  }
};
