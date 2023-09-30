import { copyFile, lstat, rm, stat, symlink } from "fs/promises";
import { basename } from "path";
import { dirname as dirnamePosix } from "path/posix";
import type { AnnotationInfo } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import { Service, calc } from "@ophidian/core";
import { FileSystemAdapter, normalizePath, Notice } from "obsidian";
import log, { logError } from "@/log";
import { SettingsService } from "@/settings/base";
import ZoteroPlugin from "@/zt-main";

export class ImgCacheImporter extends Service {
  onload() {
    log.debug("loading ImgCacheImporter");
  }
  async onunload() {
    await this.flush();
  }

  get app() {
    return this.use(ZoteroPlugin).app;
  }

  settings = this.use(SettingsService);

  private queue = new Map<string, () => Promise<boolean>>();

  getCachePath(annot: AnnotationInfo) {
    return getCacheImagePath(annot, this.settings.current?.zoteroDataDir);
  }

  @calc
  get mode() {
    return this.settings.current?.imgExcerptImport;
  }
  @calc
  get path() {
    return this.settings.current?.imgExcerptPath;
  }
  @calc
  get imgExcerptDir(): string | null {
    return this.mode ? this.path : null;
  }

  private getInVaultPath(annot: AnnotationInfo): string | null {
    if (!this.imgExcerptDir || annot.type !== AnnotationType.image) return null;
    const cachePath = this.getCachePath(annot);
    return getInVaultPath(annot, cachePath, this.imgExcerptDir);
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
  async flush(): Promise<boolean[]> {
    const result = await Promise.all(
      [...this.queue.values()].map((task) => task()),
    );
    return result;
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
    // first check cache exist and is file
    const mtimeSrc = await stat(cachePath)
      .then((stat) => {
        if (!stat.isFile() && !stat.isSymbolicLink()) {
          const msg = `failed to link image excerpt cache to vault: given path not file ${cachePath}`;
          new Notice(msg);
          logError(msg, null);
          return -1;
        }
        return stat.mtimeMs;
      })
      .catch((err) => {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          const msg = `failed to link image excerpt cache to vault: file not found ${cachePath}`;
          new Notice(msg);
          logError(msg, err);
          return -1;
        }
        throw err;
      });
    if (mtimeSrc === -1) return false;

    const importMode = this.mode;
    if (importMode === false) {
      log.trace("import mode disabled");
      return false;
    }

    // create folder if not exist
    const parentDir = dirnamePosix(inVaultPath);
    if (parentDir !== "." && parentDir !== "..") {
      await this.app.vault.createFolder(parentDir).catch(() => void 0);
    }

    if (this.app.vault.adapter instanceof FileSystemAdapter) {
      const targetPath = this.app.vault.adapter.getFullPath(inVaultPath);
      const stat = await lstat(targetPath).catch((err) => {
        if (err.code !== "ENOENT") throw err;
        return null;
      });
      if (importMode === "copy") {
        let mtimeTarget = -1;
        if (stat) {
          if (stat.isSymbolicLink()) {
            log.trace(targetPath + " is symlink, unlinking");
            await rm(targetPath);
          } else if (stat.isFile()) {
            mtimeTarget = stat.mtimeMs;
          } else {
            const msg =
              "Failed to import image excerpt cache: cannot overwrite non-file " +
              targetPath;
            new Notice(msg);
            logError(msg, null);
            return false;
          }
        }
        if (mtimeTarget < 0 || mtimeSrc > mtimeTarget) {
          log.trace(
            targetPath +
              " is file, " +
              (mtimeTarget < 0 ? "creating" : "overwritting"),
          );
          await copyFile(cachePath, targetPath);
          new Notice(`Copied image excerpt cache to vault: ${inVaultPath}`);
          return true;
        } else {
          log.trace("mtime check pass, skipping");
        }
      } else {
        if (stat) {
          if (stat.isSymbolicLink()) {
            log.trace(targetPath + " is symlink, skipping");
            return false;
          } else if (stat.isFile()) {
            log.trace(targetPath + " is file, remove before symlinking");
            await rm(targetPath);
          } else {
            const msg =
              "Failed to import image excerpt cache: cannot overwrite non-file " +
              targetPath;
            new Notice(msg);
            logError(msg, null);
            return false;
          }
        }
        // then create symlink
        try {
          await symlink(cachePath, targetPath, "file");
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === "EPERM") {
            new Notice(
              `Failed to symlink image excerpt cache to vault: permission denied ${cachePath}, ` +
                `check directory permission or change import mode to copy. ` +
                `If you are using FAT32 drive, symlink is not supported.`,
            );
            logError(
              `Failed to symlink image excerpt cache to vault: permission denied ${cachePath}`,
              err,
            );
            return false;
          }
          throw err;
        }
        new Notice(`linked image excerpt cache to vault: ${inVaultPath}`);
        return true;
      }
      return false;
    } else {
      throw new Error("Mobile not supported");
    }
  }
}

const getInVaultName = (cachePath: string, groupID: number | null) =>
  (groupID ?? "") + basename(cachePath);

const getInVaultPath = (
  annot: AnnotationInfo,
  cachePath: string,
  imgExcerptPath: string,
): string => {
  const inVaultName = getInVaultName(cachePath, annot.groupID);

  return [normalizePath(imgExcerptPath), inVaultName].join("/");
};
