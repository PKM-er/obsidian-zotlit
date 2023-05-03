import { homedir } from "os";
import { join } from "path";
import assertNever from "assert-never";
import { getBinaryFullPath } from "@/install-guide/version";

import Settings from "@/settings/base";
import DatabaseWorker, { DatabaseStatus } from "./service";

interface SettingOptions {
  zoteroDataDir: string;
  citationLibrary: number;
}

export class DatabaseSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      zoteroDataDir: join(homedir(), "Zotero"),
      citationLibrary: 1,
    };
  }

  async apply(key: keyof SettingOptions): Promise<void> {
    const worker = this.use(DatabaseWorker);
    switch (key) {
      case "zoteroDataDir":
        if (worker.status === DatabaseStatus.NotInitialized) {
          return await worker.initialize();
        } else {
          return await worker.refresh({ task: "full" });
        }
      case "citationLibrary":
        return await worker.refresh({
          task: "searchIndex",
          force: true,
        });
      default:
        assertNever(key);
    }
  }

  /** cache result */
  #nativeBinding?: string;
  get nativeBinding(): string {
    if (this.#nativeBinding) return this.#nativeBinding;
    const binaryFullPath = getBinaryFullPath(this.manifest);
    if (binaryFullPath) {
      this.#nativeBinding = binaryFullPath;
      return this.#nativeBinding;
    } else throw new Error("Failed to get native binding path");
  }
  get zoteroDbPath(): string {
    return join(this.zoteroDataDir, "zotero.sqlite");
  }
  get betterBibTexDbPath(): string {
    return join(this.zoteroDataDir, "better-bibtex-search.sqlite");
  }
  get zoteroCacheDirPath(): string {
    return join(this.zoteroDataDir, "cache");
  }

  get dbConnParams() {
    return {
      nativeBinding: this.nativeBinding,
      mainDbPath: this.zoteroDbPath,
      bbtDbPath: this.betterBibTexDbPath,
    };
  }
}
