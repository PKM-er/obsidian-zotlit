/* eslint-disable @typescript-eslint/naming-convention */

import { join } from "path/posix";
import { betterSqlite3 } from "@obzt/common";
import type { PluginManifest } from "obsidian";
import { FileSystemAdapter, Platform } from "obsidian";
import _PLATFORM_SUPPORT from "support-platform";

export const {
  arch,
  platform,
  versions: { modules, electron },
} = process;

export type ModuleVersions = keyof typeof _PLATFORM_SUPPORT;

export const PLATFORM_SUPPORT = _PLATFORM_SUPPORT as Record<
  ModuleVersions,
  Record<string, string[]>
>;

/**
 * @returns 0 if the version is supported, 1 if the version is newer than the latest supported version, -1 if the version is not supported
 */
export const compareElectronVer = ({ modules }: PlatformDetails): number => {
  if (modules in PLATFORM_SUPPORT) return 0;
  const supportedVersions = Object.keys(PLATFORM_SUPPORT);
  const supportedVersionsNum = supportedVersions
    .map((v) => parseInt(v, 10))
    .sort((a, b) => a - b);
  const modulesNum = parseInt(modules, 10);
  // If the version is newer than the latest supported version
  if (modulesNum > supportedVersionsNum[supportedVersionsNum.length - 1]) {
    return 1;
  }
  return -1;
};

export const isPlatformSupported = ({ platform, arch }: PlatformDetails) => {
  return !!PLATFORM_SUPPORT[modules as ModuleVersions][platform]?.includes(
    arch,
  );
};

export interface PlatformDetails {
  /**
   * The operating system CPU architecture for which the Node.js binary was compiled.
   * Possible values are: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`,`'mipsel'`, `'ppc'`,`'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, and `'x64'`.
   **/
  arch: string;
  platform: NodeJS.Platform;
  modules: string;
  electron: string;
}

export const getPlatformDetails = () => {
  if (Platform.isDesktopApp) {
    return {
      arch: process.arch,
      platform: process.platform,
      modules: process.versions.modules,
      electron: process.versions.electron,
    };
  } else {
    return null;
  }
};

export const getBinaryVersion = (manifest: PluginManifest) =>
  manifest.versions?.["better-sqlite3"];

export const getBinaryPath = (manifest: PluginManifest) => {
  const binaryVersion = getBinaryVersion(manifest);
  if (!binaryVersion) {
    return null;
  }
  return join(app.vault.configDir, betterSqlite3(binaryVersion));
};

export const getBinaryFullPath = (manifest: PluginManifest): string | null => {
  const binaryPath = getBinaryPath(manifest);
  if (!binaryPath) {
    return null;
  }
  if (!(app.vault.adapter instanceof FileSystemAdapter)) {
    return null;
  }
  return app.vault.adapter.getFullPath(binaryPath);
};
