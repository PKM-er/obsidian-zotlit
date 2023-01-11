/* eslint-disable @typescript-eslint/no-explicit-any */
import { enumerate } from "@obzt/common";
import { Service } from "@ophidian/core";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log, { LogSettings } from "@log";

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
  literatureNoteFolder: InVaultPath;
  template: TemplateSettings;
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
    log: plugin.use(LogSettings),
    template: plugin.use(TemplateSettings),
    literatureNoteFolder: new InVaultPath("LiteratureNotes"),
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
  enumerate<RequireConvert>()("literatureNoteFolder"),
);

const isRequireConvert = (key: string): key is RequireConvert =>
  requireConvert.has(key as RequireConvert);

export class SettingLoader extends Service {
  plugin = this.use(ZoteroPlugin);
  async onload(): Promise<void> {
    log.debug("Loading Settings...");
    const json = (await this.plugin.loadData()) ?? {};
    const settings = this.plugin.settings;
    await settings.database.fromJSON(json, false);
    await settings.watcher.fromJSON(json, false);
    await settings.imgImporter.fromJSON(json);
    await settings.log.fromJSON(json);
    await settings.template.fromJSON(json, false);
    await Promise.all(
      Object.keys(settings).map(async (k) => {
        const key = k as keyof ZoteroSettings;
        if (isRequireConvert(key)) {
          await settings[key].fromJSON(json[key]);
        } else if (json[key] !== undefined) {
          settings[key] = json[key] as never;
        }
      }),
    );
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
