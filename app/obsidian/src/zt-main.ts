import "./main.less";
import "./index.css";

import { use } from "@ophidian/core";
import type { App, PluginManifest } from "obsidian";
import { Plugin } from "obsidian";

import checkLib from "./install-guide/index.jsx";
import NoteFeatures from "./note-feature/service";
import { AnnotBlock } from "./services/annot-block/service";
import { CitekeyClick } from "./services/citekey-click/service";
import NoteIndex from "./services/note-index/service";
import PDFParser from "./services/pdf-parser/service";
import { Server } from "./services/server/service";
import {
  TemplateComplier,
  TemplateLoader,
  TemplateRenderer,
  TemplateEditorHelper,
} from "./services/template";
import {
  DatabaseWorker,
  ImgCacheImporter,
  DatabaseWatcher,
  ZoteroDatabase,
} from "./services/zotero-db";
import ZoteroSettingTab from "./setting-tab";
import { SettingLoader } from "./settings/service";
import log from "@/log";

// declare global {
//   // eslint-disable-next-line no-var
//   var zt: ZoteroPlugin | undefined;
// }

export default class ZoteroPlugin extends Plugin {
  use = use.plugin(this);

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!checkLib(manifest)) {
      throw new Error("Library check failed");
    }
    // this.noteParser = new NoteParser(this);
  }

  settings = this.use(SettingLoader);

  noteIndex = this.use(NoteIndex);
  server = this.use(Server);
  citekeyClick = this.use(CitekeyClick);
  templateEditor = this.use(TemplateEditorHelper);
  noteFeatures = this.use(NoteFeatures);

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

  annotBlockWorker = this.use(AnnotBlock);
  pdfParser = this.use(PDFParser);

  async onload() {
    log.info("loading Obsidian Zotero Plugin");
    this.addSettingTab(new ZoteroSettingTab(this));

    // globalThis.zt = this;
    // this.register(() => delete globalThis.zt);
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
  }
}
