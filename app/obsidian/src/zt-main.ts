import "./main.less";
import "./index.css";
import "./dialog.less";

import { use } from "@ophidian/core";
import type { App, PluginManifest } from "obsidian";
import { Plugin } from "obsidian";

import log, { LogService } from "@/log";
import type { PluginAPI } from "./api";
import checkLib from "./install-guide/index.jsx";
import NoteFeatures from "./note-feature/service";
// import { AnnotBlock } from "./services/annot-block/service";
import { CitekeyClick } from "./services/citekey-click/service";
import NoteIndex from "./services/note-index/service";
import { NoteParser } from "./services/note-parser/service";
import PDFParser from "./services/pdf-parser/service";
import { Server } from "./services/server/service";
import { TemplateRenderer, TemplateEditorHelper } from "./services/template";
import {
  DatabaseWorker,
  ImgCacheImporter,
  DatabaseWatcher,
  ZoteroDatabase,
} from "./services/zotero-db";
import ZoteroSettingTab from "./setting-tab";
import { useSettings } from "./settings/base";

declare global {
  // eslint-disable-next-line no-var
  var zoteroAPI: PluginAPI | undefined;
}

export default class ZoteroPlugin extends Plugin {
  use = use.plugin(this);

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    if (!checkLib(manifest, app)) {
      throw new Error("Library check failed");
    }
  }

  settings = useSettings(this);

  services = {
    /** dummy used to init log settings */
    _log: this.use(LogService),
  };

  noteIndex = this.use(NoteIndex);
  server = this.use(Server);
  citekeyClick = this.use(CitekeyClick);
  templateEditor = this.use(TemplateEditorHelper);
  noteFeatures = this.use(NoteFeatures);
  noteParser = this.use(NoteParser);

  get databaseAPI() {
    return this.dbWorker.api;
  }
  dbWorker = this.use(DatabaseWorker);
  imgCacheImporter = this.use(ImgCacheImporter);
  dbWatcher = this.use(DatabaseWatcher);
  database = this.use(ZoteroDatabase);

  templateRenderer = this.use(TemplateRenderer);

  // annotBlockWorker = this.use(AnnotBlock);
  pdfParser = this.use(PDFParser);

  onload() {
    log.info("loading ZotLit");
    this.addSettingTab(new ZoteroSettingTab(this));
    globalThis.zoteroAPI = {
      version: this.manifest.version,
      getDocItems: (ids) => {
        return this.databaseAPI.getItems(ids);
      },
      getItemIDsFromCitekey: (...args) => {
        return this.databaseAPI.getItemIDsFromCitekey(...args);
      },
      getAnnotsFromKeys: (...args) => {
        return this.databaseAPI.getAnnotFromKey(...args);
      },
      getAnnotsOfAtch: (...args) => {
        return this.databaseAPI.getAnnotations(...args);
      },
      getAttachments: (...args) => {
        return this.databaseAPI.getAttachments(...args);
      },
      getLibs: () => {
        return this.databaseAPI.getLibs();
      },
    };
    this.register(() => {
      delete globalThis.zoteroAPI;
    });
    // globalThis.zt = this;
    // this.register(() => delete globalThis.zt);
  }

  onunload() {
    log.info("unloading ZotLit");
  }
}
