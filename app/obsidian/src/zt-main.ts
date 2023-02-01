import "./main.less";
import "@obzt/components/styles";

import type { Extension } from "@codemirror/state";
import { parseQuery } from "@obzt/protocol";
import { use } from "@ophidian/core";
import type { App, PluginManifest } from "obsidian";
import { Notice, Plugin } from "obsidian";
import log from "@log";

import { AnnotBlockWorker, registerCodeBlock } from "./annot-block";
import {
  CitationEditorSuggest,
  insertCitation,
} from "./insert-citation/index.js";
import checkLib from "./install-guide/index.jsx";
import registerNoteFeature from "./note-feature";
import { NoteFields } from "./note-feature/note-fields/service";
import NoteIndex from "./note-index/service.js";
// import NoteParser from "./note-parser";
// import PDFCache from "./pdf-outline";
import { Server } from "./server/service";
import { ZoteroSettingTab } from "./setting-tab/index.js";
import { SettingLoader } from "./settings/service.js";
import { TemplateComplier, TemplateLoader, TemplateRenderer } from "./template";
import registerEtaEditorHelper from "./template/editor";
import { TopicImport } from "./topic";
import DatabaseWatcher from "./zotero-db/auto-refresh/service";
import DatabaseWorker from "./zotero-db/connector/service";
import { ZoteroDatabase } from "./zotero-db/database";
import { ImgCacheImporter } from "./zotero-db/img-import/service";

declare global {
  // eslint-disable-next-line no-var
  var zt: ZoteroPlugin | undefined;
}

export default class ZoteroPlugin extends Plugin {
  use = use.plugin(this);

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!checkLib(manifest)) {
      throw new Error("Library check failed");
    }
    this.annotBlockWorker = new AnnotBlockWorker(this);
    // this.noteParser = new NoteParser(this);
    // this.pdfCache = new PDFCache(this);
  }

  settings = this.use(SettingLoader);

  noteIndex = this.use(NoteIndex);
  noteFields = this.use(NoteFields);
  server = this.use(Server);
  topicImport = this.use(TopicImport);

  get databaseAPI() {
    return this.dbWorker.api;
  }
  dbWorker = this.use(DatabaseWorker);
  imgCacheImporter = this.use(ImgCacheImporter);
  dbWatcher = this.use(DatabaseWatcher);
  database = this.use(ZoteroDatabase);

  templateRenderer = this.use(TemplateRenderer);
  templateComplier = this.use(TemplateComplier);
  templateLoader = this.use(TemplateLoader);

  // noteParser: NoteParser;
  // pdfCache: PDFCache;
  annotBlockWorker: AnnotBlockWorker;

  editorExtensions: Extension[] = [];
  async onload() {
    log.info("loading Obsidian Zotero Plugin");
    registerCodeBlock(this);
    registerEtaEditorHelper(this);
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
        await this.dbWorker.refresh({ task: "full" });
      },
    });
    this.addCommand({
      id: "refresh-zotero-search-index",
      name: "Refresh Zotero Search Index",
      callback: async () => {
        await this.dbWorker.refresh({ task: "searchIndex" });
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

    // globalThis.zt = this;
    // this.register(() => delete globalThis.zt);

    // this.registerEvent(this.server.on("bg:notify", (data) => {}));
    // this.registerEvent(
    //   this.server.on("zotero/export", (p) => console.warn(parseQuery(p))),
    // );
    // this.registerEvent(
    //   this.server.on("zotero/open", (p) => console.warn(parseQuery(p))),
    // );

    registerNoteFeature(this);
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
  }
}
