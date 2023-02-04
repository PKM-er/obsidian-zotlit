import { mkdir, stat, symlink } from "fs/promises";
import { basename, dirname } from "path";
import { join } from "path/posix";
import type { AnnotationInfo } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import { Service } from "@ophidian/core";
import type { FileSystemAdapter } from "obsidian";
import { Notice, TFile } from "obsidian";
import { DatabaseSettings } from "../connector/settings";
import { ImgImporterSettings } from "./settings";
import log, { logError } from "@/log";

export class ImgCacheImporter extends Service {
  onload() {
    log.debug("loading ImgCacheImporter");
  }
  async onunload() {
    await Promise.all(this.flush());
  }

  databaseSettings = this.use(DatabaseSettings);
  settings = this.use(ImgImporterSettings);

  private queue = new Map<string, () => Promise<boolean>>();

  getCachePath(annot: AnnotationInfo) {
    return getCacheImagePath(annot, this.databaseSettings.zoteroDataDir);
  }

  getInVaultPath(annot: AnnotationInfo): string | null {
    if (!this.settings.imgExcerptDir || annot.type !== AnnotationType.image)
      return null;
    const cachePath = getCacheImagePath(
      annot,
      this.databaseSettings.zoteroDataDir,
    );
    return getInVaultPath(annot, cachePath, this.settings.imgExcerptDir);
  }

  import(annot: AnnotationInfo): string | null {
    const cachePath = this.getCachePath(annot),
      inVaultPath = this.getInVaultPath(annot);
    if (!inVaultPath) return null;
    let task;
    if (!this.queue.has(inVaultPath)) {
      task = async () => {
        const result = await this.linkToVault(inVaultPath, cachePath);
        this.queue.delete(inVaultPath);
        return result;
      };
      this.queue.set(inVaultPath, task);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      task = this.queue.get(inVaultPath)!;
    }
    // return task;
    return inVaultPath;
  }
  flush(): Promise<boolean>[] {
    return [...this.queue.values()].map((task) => task());
  }
  cancel(): void {
    this.queue.clear();
  }

  /**
   * create symlink from the zotero image excerpt cache to the vault
   * @param inVaultPath in-vault path to the image excerpt
   * @param cachePath path to image excerpt cache
   */
  async linkToVault(inVaultPath: string, cachePath: string): Promise<boolean> {
    // first check if exist in vault
    const file = app.vault.getAbstractFileByPath(inVaultPath);
    if (file) {
      if (file instanceof TFile) return true;
      else {
        logError(
          "failed to get in-vault image excerpt: given path not file",
          inVaultPath,
        );
        return false;
      }
    }

    // if not exist, symlink to vault
    // first check cache exist and is file
    try {
      const stats = await stat(cachePath);
      if (!stats.isFile()) {
        const msg = `failed to link image excerpt cache to vault: given path not file ${cachePath}`;
        new Notice(msg);
        logError(msg, null);
        return false;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const msg = `failed to link image excerpt cache to vault: file not found ${cachePath}`;
        new Notice(msg);
        logError(msg, error);
        return false;
      } else throw error;
    }

    const symlinkPath = (app.vault.adapter as FileSystemAdapter).getFullPath(
      inVaultPath,
    );

    // create folder if not exist
    try {
      await mkdir(dirname(symlinkPath), { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }

    // then create symlink
    await symlink(cachePath, symlinkPath);
    new Notice(`linked image excerpt cache to vault: ${inVaultPath}`);
    return true;
  }
}

const getInVaultName = (cachePath: string, groupID: number | null) =>
  (groupID ?? "") + basename(cachePath);

const getInVaultPath = (
  annot: AnnotationInfo,
  cachePath: string,
  imgExcerptPath: string,
): string => {
  const inVaultName = getInVaultName(cachePath, annot.groupID),
    inVaultPath = join(imgExcerptPath, inVaultName);
  return inVaultPath;
};
