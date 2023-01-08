/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LogLevel } from "@obzt/common";
import { enumerate } from "@obzt/common";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log, { DEFAULT_LOGLEVEL } from "@log";

import NoteTemplate from "./template/index.js";
import { WatcherSettings } from "./zotero-db/auto-refresh/settings.js";
import { DatabaseSettings } from "./zotero-db/connector/settings.js";
import { ImgImporterSettings } from "./zotero-db/img-import/settings.js";
import type ZoteroPlugin from "./zt-main.js";

export interface ZoteroSettings {
  database: DatabaseSettings;
  watcher: WatcherSettings;
  imgImporter: ImgImporterSettings;
  literatureNoteFolder: InVaultPath;
  template: NoteTemplate;
  logLevel: LogLevel;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
  // autoPairEta: boolean;
  mutoolPath: string | null;
}

export const getDefaultSettings = (plugin: ZoteroPlugin): ZoteroSettings => {
  // set inside logger.ts
  // log.setDefaultLevel(DEFAULT_LOG_LEVEL);
  return {
    database: plugin.use(DatabaseSettings),
    watcher: plugin.use(WatcherSettings),
    imgImporter: plugin.use(ImgImporterSettings),
    literatureNoteFolder: new InVaultPath("LiteratureNotes"),
    template: new NoteTemplate(plugin),
    logLevel: DEFAULT_LOGLEVEL,
    citationEditorSuggester: true,
    showCitekeyInSuggester: false,
    // autoPairEta: true,
    mutoolPath: null,
  };
};
export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];
type RequireConvert = SettingKeyWithType<ClassInSettings<any>>;

const requireConvert = new Set(
  enumerate<RequireConvert>()("literatureNoteFolder", "template"),
);

const isRequireConvert = (key: string): key is RequireConvert =>
  requireConvert.has(key as RequireConvert);
export async function loadSettings(this: ZoteroPlugin) {
  const json = (await this.loadData()) ?? {};
  this.settings.database.fromJSON(json);
  this.settings.watcher.fromJSON(json);
  this.settings.imgImporter.fromJSON(json);
  await Promise.all(
    Object.keys(this.settings).map(async (k) => {
      const key = k as keyof ZoteroSettings;
      if (isRequireConvert(key)) {
        await this.settings[key].fromJSON(json[key]);
      } else if (json[key] !== undefined) {
        this.settings[key] = json[key] as never;
      }
    }),
  );
  log.level = this.settings.logLevel;
}

export async function saveSettings(this: ZoteroPlugin) {
  const { database, watcher, imgImporter, ...regular } = this.settings;
  await this.saveData({
    ...database.toJSON(),
    ...watcher.toJSON(),
    ...imgImporter.toJSON(),
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
