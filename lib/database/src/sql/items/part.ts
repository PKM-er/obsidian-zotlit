import type { Transaction } from "@aidenlx/better-sqlite3";
import type { IDLibID, KeyLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import type { Output, OutputSql } from "./base.js";
import { sql } from "./base.js";

const queryByID = sql("id"),
  queryByKey = sql("key");

interface Input {
  libId: number;
  itemId: number;
}

type IDItemMap = Record<number, Output>;

export class Items extends PreparedBase<Input, OutputSql, IDItemMap> {
  trxFunc = (itemIDs: IDLibID[]) =>
    itemIDs.reduce((rec, [itemId, libId]) => {
      const result = this.get({ itemId, libId }) as OutputSql;
      if (result!) {
        rec[itemId] = {
          ...result,
          collectionIDs: JSON.parse(result.collectionIDs) as number[],
        };
      }
      return rec;
    }, {} as IDItemMap);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByID;
  }

  query(itemIDs: IDLibID[]): IDItemMap {
    return (this.trx as Items["trxFunc"])(itemIDs);
  }
}

interface InputByKey {
  libId: number;
  key: string;
}

type KeyItemMap = Record<string, Output>;

export class ItemsByKey extends PreparedBase<InputByKey, OutputSql, IDItemMap> {
  trxFunc = (itemKeys: KeyLibID[]) =>
    itemKeys.reduce((rec, [key, libId]) => {
      const result = this.get({ key, libId });
      if (result) {
        rec[key] = {
          ...result,
          collectionIDs: JSON.parse(result.collectionIDs) as number[],
        };
      }
      return rec;
    }, {} as KeyItemMap);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByKey;
  }

  query(itemKeys: KeyLibID[]): KeyItemMap {
    return (this.trx as ItemsByKey["trxFunc"])(itemKeys);
  }
}
