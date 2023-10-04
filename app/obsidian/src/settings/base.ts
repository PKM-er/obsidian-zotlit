import { join } from "path";
import type { DatabaseOptions, DatabasePaths } from "@obzt/database/api";
import type { Useful } from "@ophidian/core";
import {
  calc,
  SettingsService as _SettingsService,
  getContext,
} from "@ophidian/core";
import type { Component } from "obsidian";
import { getBinaryFullPath } from "@/install-guide/version";
import ZoteroPlugin from "@/zt-main";
import { getDefaultSettings, type Settings } from "./service";

export function skip<T extends (...args: any[]) => any>(
  compute: T,
  deps: () => any,
  skipInitial = false,
) {
  let count = 0;
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    deps();
    if (count > (skipInitial ? 1 : 0)) {
      count++;
      return compute(...args);
    }
  };
}

export class SettingsService extends _SettingsService<Settings> {
  #plugin = this.use(ZoteroPlugin);
  /** cache result */
  #nativeBinding?: string;
  get nativeBinding(): string {
    if (this.#nativeBinding) return this.#nativeBinding;
    const binaryFullPath = getBinaryFullPath(this.#plugin.manifest);
    if (binaryFullPath) {
      this.#nativeBinding = binaryFullPath;
      return this.#nativeBinding;
    } else throw new Error("Failed to get native binding path");
  }

  @calc get templateDir() {
    return this.current?.template?.folder;
  }

  @calc get libId() {
    return this.current?.citationLibrary;
  }

  @calc get simpleTemplates() {
    return this.current?.template?.templates;
  }

  @calc get zoteroDbPath(): string {
    return join(this.current?.zoteroDataDir, "zotero.sqlite");
  }

  @calc get betterBibTexDbPath(): string {
    return join(this.current?.zoteroDataDir, "better-bibtex-search.sqlite");
  }

  @calc get zoteroCacheDirPath(): string {
    return join(this.current?.zoteroDataDir, "cache");
  }

  @calc get dbConnParams(): [paths: DatabasePaths, opts: DatabaseOptions] {
    return [
      { zotero: this.zoteroDbPath, bbt: this.betterBibTexDbPath },
      { nativeBinding: this.nativeBinding },
    ];
  }
}

export function useSettings(owner: Component & Partial<Useful>) {
  const svc = getContext(owner)(SettingsService) as SettingsService;
  svc.addDefaults(getDefaultSettings());
  return svc;
}
