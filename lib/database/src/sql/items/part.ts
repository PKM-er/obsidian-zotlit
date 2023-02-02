import type { Transaction } from "@aidenlx/better-sqlite3";
import type { ItemIDLibID, ItemKeyLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import type { Output as OutputSql } from "./base.js";
import { sql } from "./base.js";

const query = sql(false);

interface Input {
  libId: number;
  itemId: number;
}

type Output = Record<number, OutputSql>;

export class Items extends PreparedBase<Input, OutputSql, Output> {
  trxFunc = (itemIDs: ItemIDLibID[]) =>
    itemIDs.reduce((rec, [itemId, libId]) => {
      const result = this.statement.get({ itemId, libId });
      if (result) {
        rec[itemId] = result;
      }
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return query;
  }

  query(itemIDs: ItemIDLibID[]): Output {
    return (this.trx as Items["trxFunc"])(itemIDs);
  }
}

interface InputByKey {
  libId: number;
  key: string;
}

type OutputByKey = Record<string, OutputSql>;

export class ItemsByKey extends PreparedBase<InputByKey, OutputSql, Output> {
  trxFunc = (itemKeys: ItemKeyLibID[]) =>
    itemKeys.reduce((rec, [key, libId]) => {
      const result = this.statement.get({ key, libId });
      if (result) {
        rec[key] = result;
      }
      return rec;
    }, {} as OutputByKey);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return query;
  }

  query(itemKeys: ItemKeyLibID[]): OutputByKey {
    return (this.trx as ItemsByKey["trxFunc"])(itemKeys);
  }
}
