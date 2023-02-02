import { join } from "path/posix";
import type { ItemKeyGroup } from "@obzt/common";
import type { RegularItemInfoBase } from "@obzt/database";
import { BaseError } from "make-error";

import { Notice } from "obsidian";
import { getItemKeyGroupID } from "../note-index/service.js";
import type { TemplateRenderer } from "../template";
import { ZOTERO_KEY_FIELDNAME } from "../template";
import type { Context } from "../template/helper/base.js";
import type ZoteroPlugin from "../zt-main.js";

export class NoteExistsError extends BaseError {
  constructor(public target: string, public key: string) {
    super(`Note linked to ${key} already exists: ${target}`);
    this.name = "NoteExistsError";
  }
}

export async function createNoteForDocItem(
  this: ZoteroPlugin,
  docItem: RegularItemInfoBase,
  render: (template: TemplateRenderer, ctx: Context) => string,
) {
  const info = this.noteIndex.getNoteFromItem(docItem);
  if (info) {
    // only throw error if the note is linked to the same zotero item
    throw new NoteExistsError(info.file, docItem.key);
  }

  const { vault, fileManager, metadataCache: meta } = this.app,
    { literatureNoteFolder: folder } = this.settings.noteIndex,
    template = this.templateRenderer;
  const filepath = join(folder, template.renderFilename(docItem));
  const existingFile = vault.getAbstractFileByPath(filepath);
  if (existingFile) {
    const metadata = meta.getCache(existingFile.path);
    if (
      metadata?.frontmatter &&
      metadata.frontmatter[ZOTERO_KEY_FIELDNAME] ===
        getItemKeyGroupID(docItem, true)
    ) {
      // only throw error if the note is linked to the same zotero item
      throw new NoteExistsError(filepath, docItem.key);
    }
  }

  // filepath with suffix if file already exists
  const note = await fileManager.createNewMarkdownFile(
    app.vault.getRoot(),
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

  const info = this.noteIndex.getNoteFromItem(item);
  if (!info) {
    !slience &&
      new Notice(
        `No literature note found for zotero item with key ${item.key}`,
      );
    return false;
  }

  let linktext = info.file;
  if (info.blockId) {
    linktext += "#^" + info.blockId;
  }

  await workspace.openLinkText(linktext, "", false);
  return true;
}
