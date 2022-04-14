import { EventEmitter } from "@ipc/emitter";
import log from "@log";
import type { RegularItem } from "@zt-types";
import type Fuse from "fuse.js";

import type { MsgFromObsidian } from "../ipc/msg-obs";
import type { MsgFromDbWorker } from "../ipc/msg-worker";
import Database from "./modules/db";
import { registerGetLibs } from "./modules/get-libs";
import { registerInitIndex } from "./modules/init-index/index";
import { registerQuery } from "./modules/query";
declare global {
  var Comms: EventEmitter<MsgFromObsidian, MsgFromDbWorker>;
  var Databases: {
    main: Database | null;
    bbt: Database | null;
  };
  var Index: Record<number, Fuse<RegularItem>>;
}

Comms = new EventEmitter(self);
Databases = { main: null, bbt: null };
Index = {};

Comms.handle("cb:initDb", (main, bbt) => {
  let result: boolean;
  try {
    Databases.main?.close();
    Databases.main = new Database(main);
    Databases.bbt?.close();
    Databases.bbt = new Database(bbt);
    result = true;
  } catch (error) {
    log.error(error);
    result = false;
  }
  return [[result]];
});
registerInitIndex();
registerGetLibs();
registerQuery();
