/* eslint-disable @typescript-eslint/no-explicit-any */
import { homedir } from "os";
import { join } from "path";
// import type { LogLevelNumbers } from "loglevel";
import type { TAbstractFile, Vault } from "obsidian";
import { normalizePath } from "obsidian";
import log from "@log";

import NoteTemplate from "./note-template/index.js";
import type ZoteroPlugin from "./zt-main.js";

export interface ZoteroSettings {
  zoteroDbPath: string;
  betterBibTexDbPath: string | null;
  literatureNoteFolder: InVaultPath;
  literatureNoteTemplate: NoteTemplate;
  // logLevel: LogLevelNumbers;
  citationLibrary: number;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
}

const DEFAULT_LOG_LEVEL = 4;

export const getDefaultSettings = (): Omit<
  ZoteroSettings,
  "betterBibTexDbPath"
> & { betterBibTexDbPath: string } => {
  // log.setDefaultLevel(DEFAULT_LOG_LEVEL);
  const defaultRoot = join(homedir(), "Zotero");
  return {
    zoteroDbPath: join(defaultRoot, "zotero.sqlite"),
    betterBibTexDbPath: join(defaultRoot, "better-bibtex-search.sqlite"),
    literatureNoteFolder: new InVaultPath(),
    literatureNoteTemplate: new NoteTemplate(),
    // logLevel: DEFAULT_LOG_LEVEL,
    citationLibrary: 1,
    citationEditorSuggester: true,
    showCitekeyInSuggester: false,
  };
};
export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];
type RequireConvert = SettingKeyWithType<ClassInSettings<any>>;

export async function loadSettings(this: ZoteroPlugin) {
  const json = await this.loadData();
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
  // log.setLevel(this.settings.logLevel);
}

export async function saveSettings(this: ZoteroPlugin) {
  await this.saveData(this.settings);
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
