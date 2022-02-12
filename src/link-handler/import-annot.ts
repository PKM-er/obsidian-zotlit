import { MarkdownView, Notice, TFile } from "obsidian";

import ZoteroPlugin from "../zt-main";
import createNote from "./create-note";
import { SendData_AnnoExport } from "./index";

export const importAnnoItems = async (
  plugin: ZoteroPlugin,
  data: SendData_AnnoExport,
) => {
  const { vault, workspace } = plugin.app,
    { literatureNoteTemplate: template } = plugin.settings;

  const open = (file: TFile, newLeaf = false) =>
    workspace.openLinkText(file.path, "", newLeaf);

  const info = plugin.zoteroItems.getNoteFromKey(data.info.key);
  let noteFile = info && plugin.app.vault.getAbstractFileByPath(info.file);
  if (noteFile && noteFile instanceof TFile) {
    const annots = template.render("annots", data.annotations),
      view = workspace.getActiveViewOfType(MarkdownView);
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
    try {
      open(await createNote(plugin, data.info, data.annotations));
    } catch (err) {
      throw err;
    }
  }
};
