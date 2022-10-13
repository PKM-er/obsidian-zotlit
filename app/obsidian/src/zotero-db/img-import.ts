import { mkdir, stat, symlink } from "fs/promises";
import { basename, dirname } from "path";
import { join } from "path/posix";
import { getCacheImagePath } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import { AnnotationType } from "@obzt/zotero-type";
import type { FileSystemAdapter } from "obsidian";
import { Notice, TFile } from "obsidian";
import log from "../logger";
import type ZoteroPlugin from "../zt-main";

export class ImgCacheImporter {
  constructor(private readonly plugin: ZoteroPlugin) {}

  get imgExcerptPath() {
    return this.plugin.settings.symlinkImgExcerpt
      ? this.plugin.settings.imgExcerptPath.path
      : null;
  }

  private queue = new Map<string, () => Promise<boolean>>();

  getCachePath(annot: Annotation) {
    return getCacheImagePath(annot, this.plugin.settings.zoteroDataDir);
  }

  getInVaultPath(annot: Annotation): string | null {
    if (!this.imgExcerptPath || annot.type !== AnnotationType.image)
      return null;
    const cachePath = getCacheImagePath(
      annot,
      this.plugin.settings.zoteroDataDir,
    );
    return getInVaultPath(annot, cachePath, this.imgExcerptPath);
  }

  import(annot: Annotation): string | null {
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
        log.error(
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
        log.error(msg);
        return false;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const msg = `failed to link image excerpt cache to vault: file not found ${cachePath}`;
        new Notice(msg);
        log.error(msg);
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
  annot: Annotation,
  cachePath: string,
  imgExcerptPath: string,
): string => {
  const inVaultName = getInVaultName(cachePath, annot.groupID),
    inVaultPath = join(imgExcerptPath, inVaultName);
  return inVaultPath;
};
