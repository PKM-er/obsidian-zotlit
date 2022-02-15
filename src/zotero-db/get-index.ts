import Fuse from "fuse.js";

import type { getPromiseWorker } from "../promise-worker";
import { multipartToSQL } from "../utils/zotero-date";
import type { RegularItem } from "../zotero-types";
import creatorsSql from "./creators.sql";
import Database from "./db";
import generalSql from "./general.sql";

export type Input = { dbPath: string; libraryID: number };
export type Output = [
  items: RegularItem[],
  options: Fuse.IFuseOptions<RegularItem>,
  index: ReturnType<Fuse.FuseIndex<RegularItem>["toJSON"]>,
];

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title", "creators"],
  includeMatches: true,
  shouldSort: true,
};
const getIndex = async ({ dbPath, libraryID }: Input): Promise<Output> => {
  const db = new Database(dbPath);
  await db.open();
  const general: any[] = await db.read((db) =>
      db.prepare(generalSql).all(libraryID),
    ),
    creators: any[] = await db.read((db) =>
      db.prepare(creatorsSql).all(libraryID),
    );
  let entries = {} as any;
  for (let { itemID, fieldName, value, ...props } of general) {
    if (fieldName === "date") value = multipartToSQL(value).split("-")[0];
    if (itemID in entries) {
      entries[itemID][fieldName] = value;
    } else {
      entries[itemID] = {
        itemID,
        ...props,
        [fieldName]: value,
        creators: [],
      };
    }
  }
  for (const { itemID, ...creator } of creators) {
    entries[itemID]?.creators.push(creator);
  }
  const items = Object.values(entries) as RegularItem[];

  const index = Fuse.createIndex(fuseOptions.keys!, items).toJSON();
  db.close();
  return [items, fuseOptions, index];
};

export default getIndex;

export type indexCitationWorkerGetter = getPromiseWorker<Input, Output>;
