import Fuse from "fuse.js";

import { RegularItem } from "../zotero-types";
import creatorsSql from "./creators.sql";
import ZoteroDb from "./db";
import generalSql from "./general.sql";

export type Input = { dbPath: string; libraryID: number };
export type Output = [
  items: RegularItem[],
  options: Fuse.IFuseOptions<RegularItem>,
  index: Fuse.FuseIndex<RegularItem>,
];

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title", "creators"],
};
const getIndex = async ({ dbPath, libraryID }: Input): Promise<Output> => {
  dbPath =
    "/Users/aidenlx/Library/Application Support/Zotero/Profiles/0mfu0e9q.ZoteroDEBUG/zotero/zotero.sqlite";
  libraryID = 2;
  const db = new ZoteroDb(dbPath);
  await db.open();
  const general: any[] = await db.read((db) =>
      db.prepare(generalSql).all(libraryID),
    ),
    creators: any[] = await db.read((db) =>
      db.prepare(creatorsSql).all(libraryID),
    );
  let entries = {} as any;
  for (const { itemID, fieldName, value, ...props } of general) {
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

  const index = Fuse.createIndex(fuseOptions.keys!, items);
  db.close();
  return [items, fuseOptions, index];
};

export default getIndex;
