/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service } from "@ophidian/core";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log, { LogSettings } from "@log";

import { NoteIndexSettings } from "./note-index/settings.js";
import { TemplateSettings } from "./template/settings.js";
import { WatcherSettings } from "./zotero-db/auto-refresh/settings.js";
import { DatabaseSettings } from "./zotero-db/connector/settings.js";
import { ImgImporterSettings } from "./zotero-db/img-import/settings.js";
import ZoteroPlugin from "./zt-main.js";

export interface ZoteroSettings {
  database: DatabaseSettings;
  watcher: WatcherSettings;
  imgImporter: ImgImporterSettings;
  log: LogSettings;
  noteIndex: NoteIndexSettings;
  template: TemplateSettings;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
  autoPairEta: boolean;
  mutoolPath: string | null;
}

export const getDefaultSettings = (plugin: ZoteroPlugin): ZoteroSettings => {
  // set inside logger.ts
  // log.setDefaultLevel(DEFAULT_LOG_LEVEL);
  return {
    noteIndex: plugin.use(NoteIndexSettings),
    database: plugin.use(DatabaseSettings),
    watcher: plugin.use(WatcherSettings),
    imgImporter: plugin.use(ImgImporterSettings),
    log: plugin.use(LogSettings),
    template: plugin.use(TemplateSettings),
    citationEditorSuggester: true,
    showCitekeyInSuggester: false,
    autoPairEta: false,
    mutoolPath: null,
  };
};
export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];

export class SettingLoader extends Service {
  plugin = this.use(ZoteroPlugin);
  async onload(): Promise<void> {
    log.debug("Loading Settings...");
    const json = (await this.plugin.loadData()) ?? {};
    const settings = this.plugin.settings;
    settings.database.fromJSON(json);
    settings.watcher.fromJSON(json);
    settings.imgImporter.fromJSON(json);
    settings.log.fromJSON(json);
    settings.template.fromJSON(json);
    settings.noteIndex.fromJSON(json);
    // call this manually since no Sevice is used to apply settings on load
    await settings.log.applyAll();

    const {
      citationEditorSuggester,
      showCitekeyInSuggester,
      mutoolPath,
      autoPairEta,
    } = json;
    if (typeof citationEditorSuggester === "boolean") {
      settings.citationEditorSuggester = citationEditorSuggester;
    }
    if (typeof showCitekeyInSuggester === "boolean") {
      settings.showCitekeyInSuggester = showCitekeyInSuggester;
    }
    if (typeof autoPairEta === "boolean") {
      settings.autoPairEta = autoPairEta;
    }
    if (typeof mutoolPath === "string" && mutoolPath) {
      settings.mutoolPath = mutoolPath;
    }
    log.debug("Settings loaded");
  }
}

export async function saveSettings(this: ZoteroPlugin) {
  const { database, watcher, imgImporter, log, template, ...regular } =
    this.settings;
  await this.saveData({
    ...database.toJSON(),
    ...watcher.toJSON(),
    ...imgImporter.toJSON(),
    ...log.toJSON(),
    ...template.toJSON(),
    ...regular,
  });
}

export interface ClassInSettings<Out> {
  fromJSON(json: Out | undefined): Promise<this> | this;
  toJSON(): Out;
}

export class InVaultPath implements ClassInSettings<string> {
  static defaultPath = "/";
  constructor(path?: string) {
    this.path = path ?? InVaultPath.defaultPath;
  }

  private vaildPath!: string;
  public get path(): string {
    return this.vaildPath;
  }
  public set path(path: string) {
    if (!path) this.vaildPath = InVaultPath.defaultPath;
    else this.vaildPath = normalizePath(path);
  }

  getFile(vault: Vault): TAbstractFile | null {
    return vault.getAbstractFileByPath(this.vaildPath);
  }

  fromJSON(json: string | undefined) {
    if (json) this.vaildPath = json;
    return this;
  }
  toJSON() {
    return this.path;
  }
  toString() {
    return this.path;
  }
}
