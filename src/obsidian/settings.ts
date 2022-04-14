import log from "@log";
import { LogLevelNumbers } from "loglevel";
import { normalizePath, TAbstractFile, Vault } from "obsidian";
import { homedir } from "os";
import path from "path";

import NoteTemplate from "./note-template";
import ZoteroPlugin from "./zt-main";

export interface ZoteroSettings {
  zoteroDbPath: string;
  betterBibTexDbPath: string;
  literatureNoteFolder: InVaultPath;
  literatureNoteTemplate: NoteTemplate;
  logLevel: LogLevelNumbers;
  citationLibrary: number;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
}

const DEFAULT_LOG_LEVEL = 4;

export const getDefaultSettings = (): ZoteroSettings => {
  log.setDefaultLevel(DEFAULT_LOG_LEVEL);
  const defaultRoot = path.join(homedir(), "Zotero");
  return {
    zoteroDbPath: path.join(defaultRoot, "zotero.sqlite"),
    betterBibTexDbPath: path.join(defaultRoot, "better-bibtex-search.sqlite"),
    literatureNoteFolder: new InVaultPath(),
    literatureNoteTemplate: new NoteTemplate(),
    logLevel: DEFAULT_LOG_LEVEL,
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
    let obj = {} as any;
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
  log.setLevel(this.settings.logLevel);
}

export async function saveSettings(this: ZoteroPlugin) {
  await this.saveData(this.settings);
}

export interface ClassInSettings<Out> {
  updateFromJSON(json: Out | undefined): this;
  toJSON(): Out;
}

class InVaultPath implements ClassInSettings<string> {
  static DEFAULT_PATH = "/";
  constructor(path?: string) {
    this.path = path ?? InVaultPath.DEFAULT_PATH;
  }

  private vaildPath!: string;
  public get path(): string {
    return this.vaildPath;
  }
  public set path(path: string) {
    if (!path) this.vaildPath = InVaultPath.DEFAULT_PATH;
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
