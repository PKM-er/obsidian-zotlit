import type { Transaction } from "@aidenlx/better-sqlite3";
import type { IDLibID, KeyLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import type { Output as OutputSql } from "./base.js";
import { sql } from "./base.js";

const queryByID = sql("id"),
  queryByKey = sql("key");

interface Input {
  libId: number;
  itemId: number;
}

type Output = Record<number, OutputSql>;

export class Items extends PreparedBase<Input, OutputSql, Output> {
  trxFunc = (itemIDs: IDLibID[]) =>
    itemIDs.reduce((rec, [itemId, libId]) => {
      const result = this.statement.get({ itemId, libId });
      if (result) {
        rec[itemId] = result;
      }
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByID;
  }

  query(itemIDs: IDLibID[]): Output {
    return (this.trx as Items["trxFunc"])(itemIDs);
  }
}

interface InputByKey {
  libId: number;
  key: string;
}

type OutputByKey = Record<string, OutputSql>;

export class ItemsByKey extends PreparedBase<InputByKey, OutputSql, Output> {
  trxFunc = (itemKeys: KeyLibID[]) =>
    itemKeys.reduce((rec, [key, libId]) => {
      const result = this.statement.get({ key, libId });
      if (result) {
        rec[key] = result;
      }
      return rec;
    }, {} as OutputByKey);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByKey;
  }

  query(itemKeys: KeyLibID[]): OutputByKey {
    return (this.trx as ItemsByKey["trxFunc"])(itemKeys);
  }
}
