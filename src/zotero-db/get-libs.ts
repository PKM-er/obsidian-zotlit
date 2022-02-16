import { LogLevelDesc } from "loglevel";

import type { getPromiseWorker } from "../promise-worker";
import log from "../utils/logger";
import Database from "./db";
import libsSql from "./libraries.sql";
import type { InputBase, OutputBase } from "./type";
import isWorker from "./workers/is-worker";

export type Input = InputBase;
export interface Output extends OutputBase {
  result: LibsResult;
}

type LibsResult = {
  libraryID: number;
  name: string;
}[];

const getIndex = async ({
  mainDbPath,
  dbState,
  logLevel,
}: Input): Promise<Output> => {
  isWorker() && log.setLevel(logLevel);
  log.info("Reading Zotero database for libraries");
  const db = new Database(mainDbPath);
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
