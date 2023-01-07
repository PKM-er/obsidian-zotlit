/* eslint-disable @typescript-eslint/no-explicit-any */
import { homedir } from "os";
import { join } from "path";
import type { LogLevel } from "@obzt/common";
import { enumerate } from "@obzt/common";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log, { DEFAULT_LOGLEVEL } from "@log";

import NoteTemplate from "./template/index.js";
import type ZoteroPlugin from "./zt-main.js";

export interface ZoteroSettings {
  zoteroDataDir: string;
  zoteroDbPath: string;
  betterBibTexDbPath: string;
  zoteroCacheDirPath: string;
  literatureNoteFolder: InVaultPath;
  template: NoteTemplate;
  logLevel: LogLevel;
  citationLibrary: number;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
  // autoPairEta: boolean;
  autoRefresh: boolean;
  mutoolPath: string | null;
  symlinkImgExcerpt: boolean;
  imgExcerptPath: InVaultPath;
}

export const getDefaultSettings = (plugin: ZoteroPlugin): ZoteroSettings => {
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
    literatureNoteFolder: new InVaultPath("LiteratureNotes"),
    template: new NoteTemplate(plugin),
    logLevel: DEFAULT_LOGLEVEL,
    citationLibrary: 1,
    citationEditorSuggester: true,
    showCitekeyInSuggester: false,
    autoRefresh: true,
    // autoPairEta: true,
    mutoolPath: null,
    symlinkImgExcerpt: false,
    imgExcerptPath: new InVaultPath("ZtImgExcerpt"),
  };
};
export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];
type RequireConvert = SettingKeyWithType<ClassInSettings<any>>;

const requireConvert = new Set(
  enumerate<RequireConvert>()(
    "imgExcerptPath",
    "literatureNoteFolder",
    "template",
  ),
);
const getters = new Set([
  "zoteroDbPath",
  "betterBibTexDbPath",
  "zoteroCacheDirPath",
] as const);
const isRequireConvert = (key: string): key is RequireConvert =>
  requireConvert.has(key as RequireConvert);
export async function loadSettings(this: ZoteroPlugin) {
  const json = (await this.loadData()) ?? {};
  await Promise.all(
    Object.keys(this.settings).map(async (k) => {
      const key = k as keyof ZoteroSettings;
      // don't load settings to getters
      if (getters.has(key as never)) return;
      if (isRequireConvert(key)) {
        await this.settings[key].updateFromJSON(json[key]);
      } else if (json[key] !== undefined) {
        this.settings[key] = json[key] as never;
      }
    }),
  );
  log.level = this.settings.logLevel;
}

export async function saveSettings(this: ZoteroPlugin) {
  const { betterBibTexDbPath, zoteroDbPath, zoteroCacheDirPath, ...settings } =
    this.settings;
  await this.saveData(settings);
}

export interface ClassInSettings<Out> {
  updateFromJSON(json: Out | undefined): Promise<this> | this;
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
