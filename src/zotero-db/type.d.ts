import type { LogLevelDesc } from "loglevel";

import type Database from "./db";

export interface InputBase {
  mainDbPath: string;
  bbtDbPath: string;
  libraryID: number;
  dbState: dbState;
  logLevel: LogLevelDesc;
}

export type dbState = Record<"main" | "bbt", Database["mode"]>;

export interface OutputBase {
  dbState: dbState;
}
