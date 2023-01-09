import type { RegularItemInfo, LibraryInfo } from "@obzt/database";
import type Fuse from "fuse.js";
import Database from "./database";

export const databases = {
    main: new Database(),
    bbt: new Database(),
  },
  cache = {
    libraries: null as Record<number, LibraryInfo> | null,
    items: new Map<
      number,
      {
        byKey: Record<string, RegularItemInfo>;
        byId: Record<number, RegularItemInfo>;
        fuse: Fuse<RegularItemInfo>;
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
