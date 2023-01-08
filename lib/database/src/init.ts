import type { GeneralItem, LibraryInfo } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import { Database } from "@query/utils/index.js";

export const databases = {
    main: new Database(),
    bbt: new Database(),
  },
  cache = {
    libraries: null as Record<number, LibraryInfo> | null,
    items: new Map<
      number,
      {
        byKey: Record<string, GeneralItem>;
        byId: Record<number, GeneralItem>;
        fuse: Fuse<GeneralItem>;
      }
    >(),
  };

export const getLibInfo = () => {
  if (!cache.libraries) {
    throw new Error("Library info not loaded");
  }
  return cache.libraries;
};

export const getGroupID = (libId: number) => {
  const libInfo = getLibInfo();
  if (!libInfo[libId]) {
    throw new Error("Library not found");
  }
  return libInfo[libId].groupID;
};
