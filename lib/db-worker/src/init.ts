import type { LibraryInfo, RegularItemInfo } from "@obzt/database";
import Database from "./database";
import { createDocument } from "./search";

export const databases = {
    main: new Database(),
    bbt: new Database(),
  },
  cache = {
    libraries: null as Record<number, LibraryInfo> | null,
    search: createDocument(),
    items: new Map<
      number,
      {
        byKey: Map<string, RegularItemInfo>;
        byId: Map<number, RegularItemInfo>;
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
