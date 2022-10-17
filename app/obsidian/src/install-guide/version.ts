/* eslint-disable @typescript-eslint/naming-convention */
export const {
  arch,
  platform,
  versions: { modules, electron },
} = process;

export type ModuleVersions = keyof typeof PLATFORM_SUPPORT;

export const PLATFORM_SUPPORT = {
  "103": {
    darwin: ["arm64", "x64"],
    linux: ["x64"],
    win32: ["x64", "ia32"],
  },
} as Record<"103", Record<string, string[]>>;

export const isElectronSupported = ({ modules }: PlatformDetails) =>
  modules in PLATFORM_SUPPORT;

export const isPlatformSupported = (details: PlatformDetails) => {
  if (!isElectronSupported(details)) return false;
  const { platform, arch } = details;
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
