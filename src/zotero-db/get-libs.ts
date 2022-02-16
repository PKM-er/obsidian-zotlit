import { LogLevelDesc } from "loglevel";

import type { getPromiseWorker } from "../promise-worker";
import log from "../utils/logger";
import type { dbState } from ".";
import Database from "./db";
import libsSql from "./libraries.sql";
import isWorker from "./workers/is-worker";

export type Input = {
  dbPath: string;
  dbState: dbState;
  logLevel: LogLevelDesc;
};
export type Output = {
  dbState: dbState;
  result: LibsResult;
};

type LibsResult = {
  libraryID: number;
  name: string;
}[];

const getIndex = async ({
  dbPath,
  dbState,
  logLevel,
}: Input): Promise<Output> => {
  isWorker() && log.setLevel(logLevel);
  log.info("Reading Zotero database for libraries");
  const db = new Database(dbPath);
  await db.open(dbState.main);
  const libs: LibsResult = await db.read((db) => db.prepare(libsSql).all());
  db.close();
  log.info("Reading Zotero database for libraries done");
  return {
    result: libs,
    dbState: { ...dbState, main: db.mode },
  };
};

export default getIndex;

export type getLibsWorkerGetter = getPromiseWorker<Input, Output>;
