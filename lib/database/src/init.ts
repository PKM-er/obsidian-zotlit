import type Fuse from "fuse.js";
import Database from "./modules/db/index.js";
import type { GeneralItem } from "./modules/init-index/index.js";

export const databases: { main: Database; bbt: Database | null } = {
    main: new Database(),
    bbt: new Database(),
  },
  index: Record<number, Fuse<GeneralItem>> = {};
