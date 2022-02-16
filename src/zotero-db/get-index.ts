import Fuse from "fuse.js";
import { LogLevelDesc } from "loglevel";

import { getItemKeyGroupID } from "../note-index/utils";
import type { getPromiseWorker } from "../promise-worker";
import log from "../utils/logger";
import { multipartToSQL } from "../utils/zotero-date";
import type { RegularItem } from "../zotero-types";
import betterBibTexSql from "./better-bibtex.sql";
import creatorsSql from "./creators.sql";
import Database from "./db";
import generalSql from "./general.sql";
import type { dbState, InputBase, OutputBase } from "./type";
import isWorker from "./workers/is-worker";

export type Input = InputBase;
export interface Output extends OutputBase {
  itemMap: Record<string, RegularItem>;
  options: Fuse.IFuseOptions<RegularItem>;
  index: ReturnType<Fuse.FuseIndex<RegularItem>["toJSON"]>;
}

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title", "creators"],
  includeMatches: true,
  shouldSort: true,
};

let mainDb: Database | null = null,
  bbtDb: Database | null = null;

const getIndex = async ({
  mainDbPath,
  bbtDbPath,
  libraryID,
  dbState,
  logLevel,
}: Input): Promise<Output> => {
  isWorker() && log.setLevel(logLevel);
  const readMain = async () => {
      log.info("Reading main Zotero database for index");
      if (!mainDb || mainDb.srcDbPath !== mainDbPath) {
        mainDb?.close();
        mainDb = new Database(mainDbPath);
      }
      await mainDb.open(dbState.main);
      const result = {
        general: await mainDb.read((db) =>
          db.prepare(generalSql).all(libraryID),
        ),
        creators: await mainDb.read((db) =>
          db.prepare(creatorsSql).all(libraryID),
        ),
        mode: mainDb.mode,
      };
      log.info("Reading main Zotero database for index done");
      return result;
    },
    readBbt = async () => {
      log.info("Reading Better BibTex database");
      if (!bbtDb || bbtDb.srcDbPath !== bbtDbPath) {
        bbtDb?.close();
        bbtDb = new Database(bbtDbPath);
      }
      await bbtDb.open(dbState.bbt);
      const result = {
        citekeyMap: await bbtDb.read((db) => db.prepare(betterBibTexSql).all()),
        mode: bbtDb.mode,
      };
      bbtDb.close();
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
  return {
    itemMap: items.reduce(
      (record, item) => ((record[getItemKeyGroupID(item)] = item), record),
      {} as Record<string, RegularItem>,
    ),
    options: fuseOptions,
    index,
    dbState: { main: main.value.mode, bbt: bbtMode },
  };
};
export default getIndex;

export type indexCitationWorkerGetter = getPromiseWorker<Input, Output>;
