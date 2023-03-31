import { join } from "path/posix";
import type { ItemKeyGroup } from "@obzt/common";
import type { RegularItemInfoBase } from "@obzt/database";
import { Service } from "@ophidian/core";

import type { TFile } from "obsidian";
import { Notice } from "obsidian";
import {
  cacheAttachmentSelect,
  choosePDFAtch,
} from "@/components/atch-suggest";
import { getItemKeyOf, isLiteratureNote } from "@/services/note-index";
import type { TemplateRenderer } from "@/services/template";
import type { Context } from "@/services/template/helper/base.js";
import { DEFAULT_TEMPLATE } from "@/services/template/settings";
import ZoteroPlugin from "@/zt-main";
import { AnnotationView, annotViewType } from "./annot-view/view";
import { CitationEditorSuggest, insertCitationTo } from "./citation-suggest/";
import { NoteFields } from "./note-fields/service";
import { NoteFieldsView, noteFieldsViewType } from "./note-fields/view";
import { ProtocolHandler } from "./protocol/service";
import { openOrCreateNote } from "./quick-switch";
import {
  ItemDetailsView,
  itemDetailsViewType,
} from "./template-preview/details";
import { openTemplatePreview } from "./template-preview/open";
import {
  TemplatePreview,
  templatePreviewViewType,
} from "./template-preview/preview";
import { getHelperExtraByAtch, updateNote } from "./update-note";

class NoteFeatures extends Service {
  plugin = this.use(ZoteroPlugin);

  noteFields = this.use(NoteFields);
  // topicImport = this.use(TopicImport);
  protocol = this.use(ProtocolHandler);

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
      templatePreviewViewType,
      (leaf) => new TemplatePreview(leaf, plugin),
    );
    plugin.registerView(
      itemDetailsViewType,
      (leaf) => new ItemDetailsView(leaf, plugin),
    );
    plugin.registerEvent(
      plugin.app.workspace.on("file-menu", (menu, file) => {
        const type = plugin.templateLoader.getTemplateTypeOf(file);
        if (!type) return;
        menu.addItem((i) =>
          i
            .setIcon("edit")
            .setTitle("Open Template Preview")
            .onClick(() => {
              openTemplatePreview(type, null, plugin);
            }),
        );
      }),
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

    const updateNote = async (file: TFile) => {
      const lib = plugin.settings.database.citationLibrary;
      const itemKey = getItemKeyOf(file);
      if (!itemKey) {
        new Notice("Cannot get zotero item key from file name");
        return false;
      }
      const [item] = await plugin.databaseAPI.getItems([[itemKey, lib]]);
      if (!item) {
        new Notice("Cannot find zotero item with key " + itemKey);
        return false;
      }
      await this.updateNote(item);
    };
    plugin.addCommand({
      id: "update-literature-note",
      name: "Update Literature Note",
      editorCheckCallback(checking, _editor, ctx) {
        const shouldContinue = ctx.file && isLiteratureNote(ctx.file);
        if (checking) {
          return !!shouldContinue;
        } else if (shouldContinue) {
          updateNote(ctx.file);
        }
      },
    });
    plugin.registerEvent(
      plugin.app.workspace.on("file-menu", (menu, file) => {
        if (!isLiteratureNote(file)) {
          return;
        }
        menu.addItem((i) =>
          i
            .setTitle("Update Literature Note")
            .setIcon("sync")
            .onClick(() => updateNote(file)),
        );
      }),
    );
    plugin.registerEvent(
      plugin.app.workspace.on("file-menu", (menu, file) => {
        const type = plugin.templateLoader.getTemplateTypeOf(file);
        if (!type) return;
        menu.addItem((i) =>
          i
            .setTitle("Reset to default")
            .setIcon("reset")
            .onClick(async () => {
              // make sure prompt is shown in the active window
              const win = app.workspace.activeLeaf?.containerEl.win ?? window;
              if (!win.confirm("Reset template to default?")) return;
              await plugin.app.vault.modify(
                file as TFile,
                DEFAULT_TEMPLATE[type],
              );
            }),
        );
      }),
    );
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
    await workspace.openLinkText(firstNote, "", false, { active: true });
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
    const libId = this.plugin.database.settings.citationLibrary;
    const allAttachments = await this.plugin.databaseAPI.getAttachments(
      item.itemID,
      libId,
    );
    const selected = await choosePDFAtch(allAttachments);
    if (selected) {
      cacheAttachmentSelect(selected, item);
    }
    const extraByAtch = await getHelperExtraByAtch(
      item,
      { all: allAttachments, selected: selected ? [selected] : [] },
      this.plugin,
    );
    const extra = Object.values(extraByAtch)[0];
    const note = await this.createNoteForDocItem(item, (template, ctx) =>
      template.renderNote(extra, ctx),
    );
    return note.path;
  }

  async updateNoteFromId(id: ItemKeyGroup & { libraryID: number }) {
    const { noteIndex, databaseAPI } = this.plugin;

    const info = noteIndex.getNotesFor(id);
    if (!info.length) {
      new Notice(`No literature note found for zotero item with key ${id.key}`);
      return;
    }
    const [item] = await databaseAPI.getItems([[id.key, id.libraryID]]);
    if (!item) {
      new Notice(`Cannot find zotero item with key ${id.key}`);
      return;
    }
    await this.updateNote(item);
  }

  async updateNote(item: RegularItemInfoBase) {
    const summary = await updateNote(item, this.plugin);
    if (summary) {
      if (summary.addedAnnots > 0 || summary.updatedAnnots > 0)
        new Notice(
          `Affected ${summary.notes} notes, ` +
            `annotations: ${summary.addedAnnots} added, ` +
            `${summary.updatedAnnots} updated`,
        );
      else new Notice(`Affected ${summary.notes} notes, no annotation updated`);
    } else {
      new Notice("No note found for this literature");
    }
  }
}

export default NoteFeatures;

export class NoteExistsError extends Error {
  constructor(public targets: string[], public key: string) {
    super(`Note linked to ${key} already exists: ${targets.join(",")}`);
    this.name = "NoteExistsError";
  }
}
