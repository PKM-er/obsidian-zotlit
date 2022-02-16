import Fuse from "fuse.js";
import { LogLevelDesc } from "loglevel";

import type { getPromiseWorker } from "../promise-worker";
import log from "../utils/logger";
import { multipartToSQL } from "../utils/zotero-date";
import type { RegularItem } from "../zotero-types";
import type { dbState } from ".";
import betterBibTexSql from "./better-bibtex.sql";
import creatorsSql from "./creators.sql";
import Database from "./db";
import generalSql from "./general.sql";
import isWorker from "./workers/is-worker";

export type Input = {
  dbPath: string;
  bbtDbPath: string;
  libraryID: number;
  dbState: dbState;
  logLevel: LogLevelDesc;
};
export type Output = [
  items: RegularItem[],
  options: Fuse.IFuseOptions<RegularItem>,
  index: ReturnType<Fuse.FuseIndex<RegularItem>["toJSON"]>,
  dbState: dbState,
];

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title", "creators"],
  includeMatches: true,
  shouldSort: true,
};

const getIndex = async ({
  dbPath,
  bbtDbPath,
  libraryID,
  dbState,
  logLevel,
}: Input): Promise<Output> => {
  isWorker() && log.setLevel(logLevel);
  const readMain = async () => {
      log.info("Reading main Zotero database for index");
      const db = new Database(dbPath);
      await db.open(dbState.main);
      const result = {
        general: await db.read((db) => db.prepare(generalSql).all(libraryID)),
        creators: await db.read((db) => db.prepare(creatorsSql).all(libraryID)),
        mode: db.mode,
      };
      db.close();
      log.info("Reading main Zotero database for index done");
      return result;
    },
    readBbt = async () => {
      log.info("Reading Better BibTex database");
      const db = new Database(bbtDbPath);
      await db.open(dbState.bbt);
      const result = {
        citekeyMap: await db.read((db) => db.prepare(betterBibTexSql).all()),
        mode: db.mode,
      };
      db.close();
      log.info("Reading Better BibTex done");
      return result;
    };

  const [main, bbt] = await Promise.allSettled([readMain(), readBbt()]);
  if (main.status !== "fulfilled") {
    throw main.reason;
  }
  const { general, creators } = main.value;
  let citekeyMap: any[], bbtMode: dbState["bbt"];
  if (bbt.status === "fulfilled") {
    citekeyMap = bbt.value.citekeyMap;
    bbtMode = bbt.value.mode;
  } else {
    citekeyMap = [];
    bbtMode = dbState.bbt;
    console.error("failed to get better bibtex data: ", bbt.reason);
  }

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
  for (const { itemID, citekey } of citekeyMap) {
    entries[itemID] && (entries[itemID].citekey = citekey);
  }
  const items = Object.values(entries) as RegularItem[];

  const index = Fuse.createIndex(fuseOptions.keys!, items).toJSON();
  return [items, fuseOptions, index, { main: main.value.mode, bbt: bbtMode }];
};
export default getIndex;

export type indexCitationWorkerGetter = getPromiseWorker<Input, Output>;
