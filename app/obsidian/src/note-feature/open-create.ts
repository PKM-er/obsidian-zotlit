import { join } from "path/posix";
import type { ItemKeyGroup } from "@obzt/common";
import type { RegularItemInfoBase } from "@obzt/database";
import { BaseError } from "make-error";

import { Notice } from "obsidian";
import { getItemKeyOf } from "@/note-index";
import type { TemplateRenderer } from "@/template";
import type { Context } from "@/template/helper/base.js";
import type ZoteroPlugin from "@/zt-main.js";

export class NoteExistsError extends BaseError {
  constructor(public targets: string[], public key: string) {
    super(`Note linked to ${key} already exists: ${targets.join(",")}`);
    this.name = "NoteExistsError";
  }
}

export async function createNoteForDocItem(
  this: ZoteroPlugin,
  docItem: RegularItemInfoBase,
  render: (template: TemplateRenderer, ctx: Context) => string,
) {
  const info = this.noteIndex.getNotesFor(docItem);
  if (info.length) {
    // only throw error if the note is linked to the same zotero item
    throw new NoteExistsError(info, docItem.key);
  }

  const { vault, fileManager } = this.app,
    { literatureNoteFolder: folder } = this.settings.noteIndex,
    template = this.templateRenderer;

  const filepath = join(folder, template.renderFilename(docItem));
  const existingFile = vault.getAbstractFileByPath(filepath);
  if (existingFile) {
    if (getItemKeyOf(existingFile)) {
      // only throw error if the note is linked to the same zotero item
      throw new NoteExistsError([filepath], docItem.key);
    }
  }

  // filepath with suffix if file already exists
  const note = await fileManager.createNewMarkdownFile(
    vault.getRoot(),
    filepath,
    render(template, {
      plugin: this,
      sourcePath: filepath,
    }),
  );
  return note;
}

export async function openNote(
  this: ZoteroPlugin,
  item: ItemKeyGroup,
  slience = false,
): Promise<boolean> {
  const { workspace } = this.app;

  const info = this.noteIndex.getNotesFor(item);
  if (!info.length) {
    !slience &&
      new Notice(
        `No literature note found for zotero item with key ${item.key}`,
      );
    return false;
  }

  // TODO: support multiple notes
  const firstNote = info.sort().shift()!;
  await workspace.openLinkText(firstNote, "", false);
  return true;
}
