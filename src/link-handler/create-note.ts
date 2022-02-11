import makeError, { BaseError } from "make-error";
import { Notice, TFile } from "obsidian";
import { posix as path } from "path";

import { ItemWithAnnos } from "../note-template";
import { RegularItem } from "../zotero-types";
import { AnnotationItem } from "../zotero-types/fields";
import ZoteroPlugin from "../zt-main";

export class NoteExistsError extends BaseError {
  constructor(public target: string) {
    super("Note already exists: " + target);
    this.name = "NoteExistsError";
  }
}

const createNote = async (
  plugin: ZoteroPlugin,
  info: RegularItem,
  annots?: AnnotationItem[],
): Promise<TFile> => {
  const { vault, fileManager } = plugin.app,
    { literatureNoteFolder: folder, literatureNoteTemplate: template } =
      plugin.settings;

  const filepath = path.join(folder, template.render("filename", info));
  if (vault.getAbstractFileByPath(filepath)) {
    throw new NoteExistsError(filepath);
  }
  let infoWithAnnos = info as ItemWithAnnos;
  if (annots) infoWithAnnos.annotations = annots;
  const note = await fileManager.createNewMarkdownFileFromLinktext(
    filepath,
    "",
  );
  await vault.modify(note, template.render("content", infoWithAnnos));
  return note;
};

export default createNote;
