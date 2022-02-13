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
  const db = new ZoteroDb(dbPath);
  await db.open();
  const general: any[] = await db.read((db) =>
      db.prepare(generalSql).all(libraryID),
    ),
    creators: any[] = await db.read((db) =>
      db.prepare(creatorsSql).all(libraryID),
    );
  let entries = new Map();
  for (const { itemID, fieldName, value } of general) {
    if (entries.has(itemID)) {
      entries.get(itemID)[fieldName] = value;
    } else {
      entries.set(itemID, { itemID, [fieldName]: value, creators: [] });
    }
  }
  for (const { itemID, ...creator } of creators) {
    entries.get(itemID)?.creators.push(creator);
  }
  const items = Array.from(entries.values()) as RegularItem[];

  const index = Fuse.createIndex(fuseOptions.keys!, items);
  db.close();
  return [items, fuseOptions, index];
};

export default getIndex;
