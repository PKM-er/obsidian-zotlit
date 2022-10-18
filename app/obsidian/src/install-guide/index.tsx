import { statSync } from "fs";
import type { PluginManifest } from "obsidian";
import { Platform, Notice } from "obsidian";
import log from "../logger";
import { InstallGuideModal } from "./guide";
import type { GuideMode } from "./guide/atom";
import {
  getBinaryFullPath,
  getBinaryVersion,
  getPlatformDetails,
  isElectronSupported,
  isPlatformSupported,
} from "./version";

const showInstallGuide = (
  libPath: string,
  manifest: PluginManifest,
  mode: GuideMode,
) => {
  const platform = getPlatformDetails();
  if (!platform) {
    throw new Error("Not in desktop app");
  }
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
    const binaryVersion = getBinaryVersion(manifest);
    if (!binaryVersion) {
      throw new Error(
        `Cannot find binary version for ${manifest.name} v${manifest.version}`,
      );
    }
    // if platform is supported
    try {
      if (!statSync(libPath).isFile()) {
        // if path occupied by something that is not a file
        new Notice(
          `Path to database library occupied, please check the location manually: ` +
            libPath,
          2e3,
        );
      } else if (mode === "reset") {
        // if path occupied by a file, open modal to reset it
        new InstallGuideModal(manifest, platform, binaryVersion, mode).open();
      }
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        // if path not occupied
        new InstallGuideModal(manifest, platform, binaryVersion, mode).open();
      } else {
        // unexpected error when checking path
        new Notice(
          `Unexpected error while checking path, please check the location manually: ${libPath}, error: ${error}`,
          2e3,
        );
        log.error("Unexpected error while checking path", libPath, error);
      }
    }
  }
};

const checkLib = (manifest: PluginManifest): boolean => {
  if (!Platform.isDesktopApp) {
    throw new Error("Not in desktop app");
  }
  const binaryPath = getBinaryFullPath(manifest);
  if (!binaryPath) {
    throw new Error(
      `Cannot find binary version for ${manifest.name} v${manifest.version}`,
    );
  }
  try {
    require(binaryPath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "MODULE_NOT_FOUND") {
      showInstallGuide(binaryPath, manifest, "install");
    } else {
      new Notice(`Failed to load database library: ${err}`);
      log.error("Failed to load database library", err);
      showInstallGuide(binaryPath, manifest, "reset");
    }
    return false;
  }
};
export default checkLib;
