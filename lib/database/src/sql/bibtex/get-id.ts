import type { Transaction } from "@aidenlx/better-sqlite3";
import { PreparedBase } from "../../utils/index.js";

const query = `--sql
SELECT
  itemID
FROM
  citekeys
WHERE
  citekey = $citekey
`;

interface InputSql {
  citekey: string;
}

interface Input {
  citekeys: string[];
}

interface OutputSql {
  itemID: number;
}
type Output = Record<string, number>;

export class BibtexGetId extends PreparedBase<InputSql, OutputSql, Output> {
  trxFunc = (citekeys: string[]) =>
    citekeys.reduce((rec, citekey) => {
      const result = this.get({ citekey });
      rec[citekey] = result?.itemID ?? -1;
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return query;
  }

  get(input: InputSql): OutputSql | undefined {
    return this.statement.get(input);
  }

  query(input: Input): Output {
    return (this.trx as BibtexGetId["trxFunc"])(input.citekeys);
  }
}
