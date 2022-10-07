import type { GeneralItem } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import Database from "./modules/db/index.js";

export const databases = {
    main: new Database(),
    bbt: new Database(),
  },
  fuseIndex: Record<number, Fuse<GeneralItem>> = {},
  itemKeyIndex: Record<number, Record<string, GeneralItem>> = {},
  itemIdIndex: Record<number, Record<number, GeneralItem>> = {};
