import { statSync } from "fs";
import { join } from "path";
import { constants } from "@obzt/common";
import type { FileSystemAdapter, PluginManifest } from "obsidian";
import { Platform, Notice } from "obsidian";
import { GoToDownloadModal } from "./guide";
import type { PlatformDetails } from "./version";
import { isElectronSupported, isPlatformSupported } from "./version";

const showInstallGuide = (libPath: string, manifest: PluginManifest) => {
  const platform: PlatformDetails = {
    arch: process.arch,
    platform: process.platform,
    modules: process.versions.modules,
    electron: process.versions.electron,
  };
  if (!isElectronSupported(platform)) {
    new Notice(
      `The electron (electron: ${platform.electron}, module version: ${platform.modules}) ` +
        `in current version of obsidian is not supported by obsidian-zotero-plugin,` +
        ` please reinstall using latest obsidian installer from official website`,
    );
  } else if (!isPlatformSupported(platform)) {
    new Notice(
      `Your device (${platform.arch}-${platform.platform}) is not supported by obsidian-zotero-plugin`,
    );
  } else {
    // if platform is supported
    try {
      if (!statSync(libPath).isFile()) {
        new Notice(
          `Path to database library occupied, please check the location manually: ` +
            libPath,
          2e3,
        );
      }
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        // if library file does not exist
        new GoToDownloadModal(manifest, platform).open();
      } else {
        new Notice(error.toString());
      }
    }
  }
};

const getConfigDirFunc = () =>
  (app.vault.adapter as FileSystemAdapter).getFullPath(app.vault.configDir);

const checkLib = (manifest: PluginManifest): boolean => {
  if (!Platform.isDesktopApp) {
    throw new Error("Not in desktop app");
  }
  const libPath = join(getConfigDirFunc(), constants.libName);
  try {
    require(libPath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "MODULE_NOT_FOUND") {
      showInstallGuide(libPath, manifest);
    } else {
      new Notice(`Failed to load database library: ${err}`);
    }
    return false;
  }
};
export default checkLib;
