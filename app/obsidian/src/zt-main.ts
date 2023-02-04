import "./main.less";

import type { Extension } from "@codemirror/state";
import { use } from "@ophidian/core";
import type { App, PluginManifest } from "obsidian";
import { Notice, Plugin } from "obsidian";
import log from "@log";

import { AnnotBlock } from "./annot-block/service";
import {
  CitationEditorSuggest,
  insertCitation,
} from "./insert-citation/index.js";
import checkLib from "./install-guide/index.jsx";
import registerNoteFeature from "./note-feature";
import { NoteFields } from "./note-feature/note-fields/service";
import { createNoteForDocItem, openNote } from "./note-feature/open-create";
import NoteIndex from "./note-index/service.js";
// import NoteParser from "./note-parser";
// import PDFCache from "./pdf-outline";
import { Server } from "./server/service";
import { ZoteroSettingTab } from "./setting-tab/index.js";
import { SettingLoader } from "./settings/service.js";
import { TemplateComplier, TemplateLoader, TemplateRenderer } from "./template";
import registerEtaEditorHelper from "./template/editor";
import { TopicImport } from "./topic";
import { untilDbRefreshed } from "./utils/once";
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
    // this.annotBlockWorker = new AnnotBlockWorker(this);
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
  annotBlockWorker = this.use(AnnotBlock);

  createNoteForDocItem = createNoteForDocItem;
  openNote = openNote;

  editorExtensions: Extension[] = [];
  async onload() {
    log.info("loading Obsidian Zotero Plugin");
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

    this.registerEvent(
      this.server.on("bg:notify", async (_p, data) => {
        const currTopic = this.topicImport.topic;
        if (data.event !== "regular-item/add" || !currTopic) return;
        await untilDbRefreshed(this.app, {
          onRegister: (r) => this.registerEvent(r),
          waitAfterEvent: 1e3,
        });
        const items = (await this.databaseAPI.getItems(data.ids, true)).flatMap(
          (item, index) => {
            if (item === null) {
              log.warn("item not found", data.ids[index]);
              return [];
            }
            return [[item, index] as const];
          },
        );
        const tags = await this.databaseAPI.getTags(data.ids);

        for (const [item, index] of items) {
          const attachments = await this.databaseAPI.getAttachments(
            ...data.ids[index],
          );
          await this.createNoteForDocItem(item, (template, ctx) =>
            template.renderNote(
              {
                docItem: item,
                tags,
                attachment: null,
                allAttachments: attachments,
                annotations: [],
              },
              ctx,
              { tags: [currTopic] },
            ),
          );
          new Notice(`Created note for ${item.title}`, 1e3);
        }
      }),
    );
    // this.registerEvent(
    //   this.server.on("zotero/export", (p) => console.warn(parseQuery(p))),
    // );
    // this.registerEvent(
    //   this.server.on("zotero/open", (p) => console.warn(parseQuery(p))),
    // );

    registerNoteFeature(this);
    console.log("loading done");
  }

  onunload() {
    log.info("unloading Obsidian Zotero Plugin");
  }
}
