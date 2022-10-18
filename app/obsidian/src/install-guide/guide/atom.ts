import { atom } from "jotai";
import { getBinaryFullPath, getBinaryPath } from "../version";
import type { InstallGuideModal } from ".";

export const modalAtom = atom<InstallGuideModal>(null as never);

export const binaryNameAtom = atom((get) => {
  const { arch, platform, modules } = get(modalAtom).platform;
  return `${platform}-${arch}-${modules}.node.gz`;
});

export const binaryLinkAtom = atom(
  (get) =>
    `https://github.com/aidenlx/better-sqlite3/releases/download/${
      get(modalAtom).binaryVersion
    }/${get(binaryNameAtom)}`,
);

export const binaryLinkFastgitAtom = atom((get) =>
  get(binaryLinkAtom).replace("github.com", "download.fastgit.org"),
);

export const binaryPathAtom = atom((get) =>
  getBinaryPath(get(modalAtom).manifest),
);

export const binaryFullPathAtom = atom((get) =>
  getBinaryFullPath(get(modalAtom).manifest),
);

export const guideModeAtom = atom<GuideMode>((get) => get(modalAtom).mode);

export type GuideMode = "install" | "reset";
