import "./main.less";

import { Notice, Plugin, TFolder } from "obsidian";
import log from "@log";

import {
  CitationEditorSuggest,
  insertCitation,
} from "./insert-citation/index.js";
import checkLib from "./install-guide.js";
import registerNoteFeature from "./note-feature";
import NoteIndex from "./note-index/index.js";
import { ZoteroSettingTab } from "./setting-tab.js";
import type { ZoteroSettings } from "./settings.js";
import { getDefaultSettings, loadSettings, saveSettings } from "./settings.js";
import ZoteroDb from "./zotero-db/index.js";

checkLib();

export default class ZoteroPlugin extends Plugin {
  settings: ZoteroSettings = getDefaultSettings();
  loadSettings = loadSettings.bind(this);
  saveSettings = saveSettings.bind(this);
  #db?: ZoteroDb;
  get db() {
    if (!this.#db) throw new Error("access database before load");
    return this.#db;
  }

  noteIndex: NoteIndex = new NoteIndex(this);

  async onload() {
    log.info("loading Obsidian Zotero Plugin");
    await this.loadSettings();
    this.#db = new ZoteroDb(this);

    this.addCommand({
      id: "insert-markdown-citation",
      name: "Insert Markdown citation",
      editorCallback: insertCitation(this),
    });
    this.registerEditorSuggest(new CitationEditorSuggest(this));
    this.addCommand({
      id: "refresh-zotero-index",
      name: "Refresh Zotero Index",
      callback: async () => {
        await this.db.refreshIndex();
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
    registerNoteFeature(this);

    // getZoteroLinkHandlers(this).forEach((args) =>
    //   this.registerObsidianProtocolHandler(...args),
    // );

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
