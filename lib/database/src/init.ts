import type { RegularItem } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import Database from "./modules/db/index.js";

export const databases: { main: Database; bbt: Database | null } = {
    main: new Database(),
    bbt: new Database(),
  },
  index: Record<number, Fuse<RegularItem>> = {};
