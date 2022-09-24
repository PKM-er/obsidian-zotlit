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
  var Databases: { main: Database; bbt: Database | null };
  var Index: Record<number, Fuse<RegularItem>>;
}

Comms = new EventEmitter(self);
Databases = { main: new Database(), bbt: new Database() };
Index = {};

/**
 * @returns true if opened successfully
 */
const logError = (
  name: "main" | "bbt",
  path: string | null,
  result: PromiseSettledResult<boolean | undefined> | undefined,
): boolean => {
  if (!result || !path) return false;
  if (result.status === "fulfilled" && result.value === true) {
    return true;
  }
  if (result.status === "rejected" || result.value === false) {
    log.error(
      `Failed to open ${name} database`,
      result.status === "rejected"
        ? result.reason
        : "no database found at " + path,
    );
  }
  return false;
};

Comms.handle("cb:openDb", async (mainDb, bbtDb) => {
  const tasks: [main: Promise<boolean>, bbt?: Promise<boolean>] = [
    Databases.main.open(mainDb),
  ];
  if (bbtDb) {
    if (!Databases.bbt) Databases.bbt = new Database();
    tasks[1] = Databases.bbt.open(bbtDb);
  } else {
    Databases.bbt = null;
  }
  const [main, bbt] = await Promise.allSettled(tasks);
  // @ts-ignore
  return [[logError("main", mainDb, main), logError("bbt", bbtDb, bbt)]];
});
registerInitIndex();
registerGetLibs();
registerQuery();
