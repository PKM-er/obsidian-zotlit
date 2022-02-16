import assertNever from "assert-never";
import Fuse from "fuse.js";

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

export interface InitIn extends InputBase {
  action: "init";
}
export interface QueryIn extends InputBase {
  action: "query";
  pattern: string | Fuse.Expression | null;
  options?: Fuse.FuseSearchOptions;
}
export interface InitOut extends OutputBase {
  itemMap: Record<string, RegularItem>;
}
export interface QueryOut extends OutputBase {
  result: Fuse.FuseResult<RegularItem>[];
}

export type Input = InitIn | QueryIn;
export type Output = InitOut | QueryOut;

const fuseOptions: Fuse.IFuseOptions<RegularItem> = {
  keys: ["title", "creators"],
  includeMatches: true,
  shouldSort: true,
};

let mainDb: Database | null = null,
  bbtDb: Database | null = null;

let fuse: Fuse<RegularItem> | null = null;

const getIndex = async (input: Input): Promise<Output> => {
  isWorker() && log.setLevel(input.logLevel);
  if (input.action === "init") {
    const { mainDbPath, bbtDbPath, libraryID, dbState } = input;
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
          citekeyMap: await bbtDb.read((db) =>
            db.prepare(betterBibTexSql).all(),
          ),
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
      log.error("failed to get better bibtex data: ", bbt.reason);
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

    log.info("start indexing for fuse");
    const items = Object.values(entries) as RegularItem[];

    fuse = new Fuse(items, fuseOptions);
    log.info("fuse initialized");

    return {
      itemMap: items.reduce(
        (record, item) => ((record[getItemKeyGroupID(item)] = item), record),
        {} as Record<string, RegularItem>,
      ),
      dbState: { main: main.value.mode, bbt: bbtMode },
    };
  } else if (input.action === "query") {
    const { dbState, pattern, options } = input;
    if (!fuse) throw new Error("Query before init");
    let result: Fuse.FuseResult<RegularItem>[];
    if (pattern === null) {
      let docs = (fuse as any)?._docs as RegularItem[] | undefined;
      if (!docs) {
        result = [];
      } else {
        options?.limit !== undefined && (docs = docs.slice(0, options.limit));
        result = docs.map((item, index) => ({
          item,
          refIndex: index,
        }));
      }
    } else result = fuse.search(pattern, options);
    return {
      result,
      dbState,
    };
  } else assertNever(input);
};
export default getIndex;

export type indexCitationWorkerGetter = getPromiseWorker<Input, Output>;
