import type { Transaction } from "@aidenlx/better-sqlite3";
import { fromPairs } from "@mobily/ts-belt/Dict";
import type { ItemIDLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import type { Output as OutputSql } from "./base.js";
import { sql } from "./base.js";

const query = sql(false);

interface Input {
  libId: number;
  itemId: number;
}

type Output = Record<number, OutputSql[]>;

export class ItemFields extends PreparedBase<Input, OutputSql, Output> {
  trxFunc = (itemIds: ItemIDLibID[]) =>
    itemIds.map(
      ([itemId, libId]) => [itemId, this.runAll({ itemId, libId })] as const,
    );
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return query;
  }

  query(items: ItemIDLibID[]): Output {
    return fromPairs((this.trx as ItemFields["trxFunc"])(items));
  }
}
