import type { getPromiseWorker } from "../promise-worker";
import Database from "./db";
import libsSql from "./libraries.sql";

export type Input = { dbPath: string };
export type Output = {
  libraryID: number;
  name: string;
}[];

const getIndex = async ({ dbPath }: Input): Promise<Output> => {
  const db = new Database(dbPath);
  await db.open();
  const libs: Output = await db.read((db) => db.prepare(libsSql).all());
  db.close();
  return libs;
};

export default getIndex;

export type getLibsWorkerGetter = getPromiseWorker<Input, Output>;
