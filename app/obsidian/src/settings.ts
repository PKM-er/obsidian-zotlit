/* eslint-disable @typescript-eslint/no-explicit-any */
import { homedir } from "os";
import { join } from "path";
import type { LogLevel } from "@obzt/common";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log, { DEFAULT_LOGLEVEL } from "@log";

import NoteTemplate from "./note-template/index.js";
import type ZoteroPlugin from "./zt-main.js";

export interface ZoteroSettings {
  zoteroDataDir: string;
  zoteroDbPath: string;
  betterBibTexDbPath: string;
  zoteroCacheDirPath: string;
  literatureNoteFolder: InVaultPath;
  literatureNoteTemplate: NoteTemplate;
  logLevel: LogLevel;
  citationLibrary: number;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
  autoRefresh: boolean;
  mutoolPath: string | null;
}

export const getDefaultSettings = (): ZoteroSettings => {
  // set inside logger.ts
  // log.setDefaultLevel(DEFAULT_LOG_LEVEL);
  const defaultRoot = join(homedir(), "Zotero");
  return {
    zoteroDataDir: defaultRoot,
    get zoteroDbPath(): string {
      return join(this.zoteroDataDir, "zotero.sqlite");
    },
    get betterBibTexDbPath(): string {
      return join(this.zoteroDataDir, "better-bibtex-search.sqlite");
    },
    get zoteroCacheDirPath(): string {
      return join(this.zoteroDataDir, "cache");
    },
    literatureNoteFolder: new InVaultPath(),
    literatureNoteTemplate: new NoteTemplate(),
    logLevel: DEFAULT_LOGLEVEL,
    citationLibrary: 1,
    citationEditorSuggester: true,
    showCitekeyInSuggester: false,
    autoRefresh: true,
    mutoolPath: null,
  };
};
export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];
type RequireConvert = SettingKeyWithType<ClassInSettings<any>>;

export async function loadSettings(this: ZoteroPlugin) {
  // ignore settings from previous version
  const { zoteroDbPath, betterBibTexDbPath, zoteroCacheDirPath, ...json } =
    (await this.loadData()) ?? {};
  const updateFromJSON = (...keys: RequireConvert[]) => {
    if (!json) return {};
    const obj = {} as any;
    for (const key of keys) {
      obj[key] = this.settings[key].updateFromJSON(json[key]);
    }
    return obj;
  };
  Object.assign(
    this.settings,
    json,
    updateFromJSON("literatureNoteFolder", "literatureNoteTemplate"),
  );
  log.level = this.settings.logLevel;
}

export async function saveSettings(this: ZoteroPlugin) {
  const { betterBibTexDbPath, zoteroDbPath, zoteroCacheDirPath, ...settings } =
    this.settings;
  await this.saveData(settings);
}

export interface ClassInSettings<Out> {
  updateFromJSON(json: Out | undefined): this;
  toJSON(): Out;
}

class InVaultPath implements ClassInSettings<string> {
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

  updateFromJSON(json: string | undefined) {
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
