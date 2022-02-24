import "./main.less";

import { Notice, Plugin, TFolder } from "obsidian";

import checkLib from "./install-guide";
import getZoteroLinkHandlers from "./link-handler";
import NoteIndex from "./note-index/index";
import { ZoteroSettingTab } from "./setting-tab";
import {
  getDefaultSettings,
  loadSettings,
  saveSettings,
  ZoteroSettings,
} from "./settings";
import { CitationSuggester, insertCitation } from "./suggester";
import log from "./utils/logger";
import ZoteroDb from "./zotero-db";

export default class ZoteroPlugin extends Plugin {
  /** check if better-sqlite exists */
  check = (checkLib(), undefined);
  settings: ZoteroSettings = getDefaultSettings();
  loadSettings = loadSettings.bind(this);
  saveSettings = saveSettings.bind(this);

  db = new ZoteroDb(this);
  noteIndex: NoteIndex = new NoteIndex(this);

  async onload() {
    log.info("loading Obsidian Zotero Plugin");

    this.addCommand({
      id: "insert-markdown-citation",
      name: "Insert Markdown citation",
      editorCallback: insertCitation(this),
    });
    this.registerEditorSuggest(new CitationSuggester(this));
    this.addCommand({
      id: "refresh-zotero-index",
      name: "Refresh Zotero Index",
      callback: async () => {
        await this.db.refreshIndex(true);
        new Notice("Zotero index is now up-to-date");
      },
    });
    this.addCommand({
      id: "refresh-note-index",
      name: "Refresh Literature Notes Index",
      callback: () => {
        this.noteIndex.reload();
        new Notice("Literature notes re-indexed");
      },
    });

    await this.loadSettings();

    getZoteroLinkHandlers(this).forEach((args) =>
      this.registerObsidianProtocolHandler(...args),
    );

    this.db.init();

    this.addSettingTab(new ZoteroSettingTab(this));
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
  }

  async getLiteratureNoteFolder(): Promise<TFolder> {
    const { literatureNoteFolder: folder } = this.settings;
    let af = folder.getFile(this.app.vault),
      noteFolder: TFolder;
    if (af instanceof TFolder) {
      noteFolder = af;
    } else if (!af) {
      await this.app.vault.createFolder(folder.path);
      af = folder.getFile(this.app.vault);
      if (!(af instanceof TFolder)) {
        throw new Error("Failed to create note folder: " + folder.path);
      }
      noteFolder = af;
    } else {
      new Notice(
        `Invalid note folder: ${folder.path}, revert to default folder`,
      );
      folder.path = "";
      af = folder.getFile(this.app.vault);
      if (!(af instanceof TFolder)) {
        throw new Error("Failed to get default note folder: " + folder.path);
      }
      noteFolder = af;
    }
    return noteFolder;
  }
}
