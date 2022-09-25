import { posix as path } from "path";
import type { RegularItem, AnnotationItem } from "@obzt/zotero-type";
import { BaseError } from "make-error";
import type { TFile } from "obsidian";

import { getItemKeyGroupID } from "../note-index/index.js";
import type { ItemWithAnnos } from "../note-template/const.js";
import { ZOTERO_KEY_FIELDNAME } from "../note-template/const.js";
import type ZoteroPlugin from "../zt-main.js";

export class NoteExistsError extends BaseError {
  constructor(public target: string, public key: string) {
    super(`Note linked to ${key} already exists: ${target}`);
    this.name = "NoteExistsError";
  }
}

const createNote = async (
  plugin: ZoteroPlugin,
  info: RegularItem,
  annots?: AnnotationItem[],
): Promise<TFile> => {
  const { vault, fileManager, metadataCache: meta } = plugin.app,
    { literatureNoteFolder: folder, literatureNoteTemplate: template } =
      plugin.settings;

  const filepath = path.join(folder.path, template.render("filename", info));
  const existingFile = vault.getAbstractFileByPath(filepath);
  if (existingFile) {
    const metadata = meta.getCache(existingFile.path);
    if (
      metadata?.frontmatter &&
      metadata.frontmatter[ZOTERO_KEY_FIELDNAME] === getItemKeyGroupID(info)
    ) {
      // only throw error if the note is linked to the same zotero item
      throw new NoteExistsError(filepath, info.key);
    }
  }
  const infoWithAnnos = info as ItemWithAnnos;
  if (annots) infoWithAnnos.annotations = annots;
  const note = await fileManager.createNewMarkdownFileFromLinktext(
    filepath,
    "",
  );
  await vault.modify(note, template.render("content", infoWithAnnos));
  return note;
};

export default createNote;
