import type { getPromiseWorker } from "../promise-worker";
import type { dbState } from ".";
import Database from "./db";
import libsSql from "./libraries.sql";

export type Input = { dbPath: string; dbState: dbState };
export type Output = {
  dbState: dbState;
  result: LibsResult;
};

type LibsResult = {
  libraryID: number;
  name: string;
}[];

const getIndex = async ({ dbPath, dbState }: Input): Promise<Output> => {
  console.info("Reading Zotero database for libraries");
  const db = new Database(dbPath);
  await db.open(dbState.main);
  const libs: LibsResult = await db.read((db) => db.prepare(libsSql).all());
  db.close();
  console.info("Reading Zotero database for libraries done");
  return {
    result: libs,
    dbState: { ...dbState, main: db.mode },
  };
};

export default getIndex;

export type getLibsWorkerGetter = getPromiseWorker<Input, Output>;
