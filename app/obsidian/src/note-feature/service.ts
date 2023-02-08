import { join } from "path/posix";
import type { ItemKeyGroup } from "@obzt/common";
import type {
  AnnotationInfo,
  ItemIDLibID,
  RegularItemInfoBase,
} from "@obzt/database";
import { cacheActiveAtch } from "@obzt/database";
import { Service } from "@ophidian/core";

import { Notice } from "obsidian";
import { AnnotationView, annotViewType } from "./annot-view/view";
import { CitationEditorSuggest, insertCitationTo } from "./citation-suggest/";
import { NoteFieldsView, noteFieldsViewType } from "./note-fields/view";
import { openOrCreateNote } from "./quick-switch";
import { chooseFileAtch } from "@/components/atch-suggest";
import { getItemKeyOf } from "@/services/note-index";
import type { TemplateRenderer } from "@/services/template";
import type { Context } from "@/services/template/helper/base.js";
import ZoteroPlugin from "@/zt-main";

class NoteFeatures extends Service {
  plugin = this.use(ZoteroPlugin);

  onload(): void {
    const { plugin } = this;
    plugin.addCommand({
      id: "note-quick-switcher",
      name: "Open quick switcher for literature notes",
      callback: () => openOrCreateNote(plugin),
    });
    plugin.registerView(
      annotViewType,
      (leaf) => new AnnotationView(leaf, plugin),
    );
    plugin.registerView(
      noteFieldsViewType,
      (leaf) => new NoteFieldsView(leaf, plugin),
    );
    plugin.addCommand({
      id: "zotero-annot-view",
      name: "Open Zotero Annotation View in Side Panel",
      callback: () => {
        app.workspace.ensureSideLeaf(annotViewType, "right", {
          active: true,
          /**
           * Workaroud to make sure view shows active file when first open
           * TODO: bug report? replicate in Backlink, Outline etc...
           */
          state: { file: app.workspace.getActiveFile()?.path },
        });
      },
    });
    plugin.addCommand({
      id: "zotero-note-fields",
      name: "Open Literature Note Fields in Side Panel",
      callback: () => {
        app.workspace.ensureSideLeaf(noteFieldsViewType, "right", {
          active: true,
          /**
           * Workaroud to make sure view shows active file when first open
           * TODO: bug report? replicate in Backlink, Outline etc...
           */
          state: { file: app.workspace.getActiveFile()?.path },
        });
      },
    });
    plugin.addCommand({
      id: "insert-markdown-citation",
      name: "Insert Markdown citation",
      editorCallback: (editor) => insertCitationTo(editor, plugin),
    });
    plugin.registerEditorSuggest(new CitationEditorSuggest(plugin));
  }
  async openNote(item: ItemKeyGroup, slience = false): Promise<boolean> {
    const { workspace } = this.plugin.app;
    const { noteIndex } = this.plugin;

    const info = noteIndex.getNotesFor(item);
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

  async createNoteForDocItem(
    docItem: RegularItemInfoBase,
    render: (template: TemplateRenderer, ctx: Context) => string,
  ) {
    const { noteIndex } = this.plugin;

    const info = noteIndex.getNotesFor(docItem);
    if (info.length) {
      // only throw error if the note is linked to the same zotero item
      throw new NoteExistsError(info, docItem.key);
    }

    const { vault, fileManager } = this.plugin.app,
      { literatureNoteFolder: folder } = this.plugin.settings.noteIndex,
      template = this.plugin.templateRenderer;

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
        plugin: this.plugin,
        sourcePath: filepath,
      }),
    );
    return note;
  }

  async createNoteForDocItemFull(item: RegularItemInfoBase): Promise<string> {
    const { plugin } = this;
    const libId = plugin.database.settings.citationLibrary;
    const allAttachments = await plugin.databaseAPI.getAttachments(
      item.itemID,
      libId,
    );

    const attachment = await chooseFileAtch(allAttachments);
    if (attachment) {
      cacheActiveAtch(window.localStorage, item, attachment.itemID);
    }

    const annotations: AnnotationInfo[] = attachment
      ? await plugin.databaseAPI.getAnnotations(attachment.itemID, libId)
      : [];

    const tagsRecord = await plugin.databaseAPI.getTags([
      [item.itemID, libId],
      ...annotations.map((i): ItemIDLibID => [i.itemID, libId]),
    ]);

    const note = await this.createNoteForDocItem(item, (template, ctx) =>
      template.renderNote(
        {
          docItem: item,
          attachment,
          tags: tagsRecord,
          allAttachments,
          annotations,
        },
        ctx,
      ),
    );
    return note.path;
  }
}

export default NoteFeatures;

export class NoteExistsError extends Error {
  constructor(public targets: string[], public key: string) {
    super(`Note linked to ${key} already exists: ${targets.join(",")}`);
    this.name = "NoteExistsError";
  }
}
