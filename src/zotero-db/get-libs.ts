import type { getPromiseWorker } from "../promise-worker";
import Database from "./db";
import libsSql from "./libraries.sql";

export type Input = { dbPath: string; dbState: Database["mode"] };
export type Output = {
  dbState: Database["mode"];
  result: LibsResult;
};

type LibsResult = {
  libraryID: number;
  name: string;
}[];

const getIndex = async ({ dbPath, dbState }: Input): Promise<Output> => {
  const db = new Database(dbPath);
  await db.open(dbState);
  const libs: LibsResult = await db.read((db) => db.prepare(libsSql).all());
  db.close();
  return {
    result: libs,
    dbState: db.mode,
  };
};

export default getIndex;

export type getLibsWorkerGetter = getPromiseWorker<Input, Output>;
