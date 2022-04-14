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
  var Databases: { main: Database; bbt: Database };
  var Index: Record<number, Fuse<RegularItem>>;
}

Comms = new EventEmitter(self);
Databases = { main: new Database(), bbt: new Database() };
Index = {};

/**
 * @returns true if error occurred
 */
const logError = (
  name: "main" | "bbt",
  path: string,
  result: PromiseSettledResult<boolean>,
) => {
  if (result.status === "rejected" || result.value === false) {
    log.error(
      `Failed to open ${name} database`,
      result.status === "rejected"
        ? result.reason
        : "no database found at " + path,
    );
    return true;
  }
  return false;
};

Comms.handle("cb:openDb", async (mainDb, bbtDb) => {
  const [main, bbt] = await Promise.allSettled([
    Databases.main.openDatabase(mainDb),
    Databases.bbt.openDatabase(bbtDb),
  ]);
  logError("bbt", bbtDb, bbt);
  return [[!logError("main", mainDb, main)]];
});
registerInitIndex();
registerGetLibs();
registerQuery();
