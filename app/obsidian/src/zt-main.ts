import "./main.less";

import type { App, PluginManifest } from "obsidian";
import { Notice, Plugin, TFolder } from "obsidian";
import log from "@log";

import { AnnotBlockWorker } from "./annot-block";
import { activeAtchIdAtomFamily } from "./component/atoms/attachment";
import {
  CitationEditorSuggest,
  insertCitation,
} from "./insert-citation/index.js";
import checkLib from "./install-guide/index.jsx";
import registerNoteFeature from "./note-feature";
import NoteIndex from "./note-index/index.js";
// import NoteParser from "./note-parser";
// import PDFCache from "./pdf-outline";
import { ZoteroSettingTab } from "./setting-tab/index.js";
import type { ZoteroSettings } from "./settings.js";
import { getDefaultSettings, loadSettings, saveSettings } from "./settings.js";
import { ImgCacheImporter } from "./zotero-db/img-import";
import ZoteroDb from "./zotero-db/index.js";

export default class ZoteroPlugin extends Plugin {
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!checkLib(manifest)) {
      throw new Error("Library check failed");
    }
  }

  settings: ZoteroSettings = getDefaultSettings(this);
  loadSettings = loadSettings.bind(this);
  saveSettings = saveSettings.bind(this);
  #db?: ZoteroDb;
  // noteParser = new NoteParser(this);
  imgCacheImporter = new ImgCacheImporter(this);
  // pdfCache = new PDFCache(this);
  annotBlockWorker = new AnnotBlockWorker(this);
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
      id: "refresh-zotero-data",
      name: "Refresh Zotero Data",
      callback: async () => {
        await this.db.fullRefresh();
        new Notice("Zotero data is now up-to-date");
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
    this.addSettingTab(new ZoteroSettingTab(this));
    // getZoteroLinkHandlers(this).forEach((args) =>
    //   this.registerObsidianProtocolHandler(...args),
    // );

    await this.db.init();
    registerNoteFeature(this);
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
    // clean up atom family
    activeAtchIdAtomFamily.setShouldRemove(() => true);
    activeAtchIdAtomFamily.setShouldRemove(null);
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
