import type { Transaction } from "better-sqlite3";
import { PreparedBase } from "../../utils/index.js";
import { BBT_SEARCH_DB_NAME } from "./base.js";

const sqlMain = `--sql
SELECT
  itemData.itemID AS itemID
FROM
  itemData
  JOIN itemDataValues USING (valueID)
WHERE
  itemData.fieldID = (
    SELECT
      fieldID
    FROM
      fieldsCombined
    WHERE
      fieldName = 'citationKey'
    LIMIT
      1
  )
  AND itemDataValues.value = $citekey
`;

const sqlSearch = `--sql
SELECT
  itemID
FROM
  ${BBT_SEARCH_DB_NAME}.citekeys
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

export class BibtexGetIdV1 extends PreparedBase<InputSql, OutputSql, Output> {
  trxFunc = (citekeys: string[]) =>
    citekeys.reduce((rec, citekey) => {
      const result = this.get({ citekey });
      rec[citekey] = result?.itemID ?? -1;
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return sqlMain;
  }

  query(input: Input): Output {
    return (this.trx as this["trxFunc"])(input.citekeys);
  }
}

export class BibtexGetIdV0 extends PreparedBase<InputSql, OutputSql, Output> {
  trxFunc = (citekeys: string[]) =>
    citekeys.reduce((rec, citekey) => {
      const result = this.get({ citekey });
      rec[citekey] = result?.itemID ?? -1;
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return sqlSearch;
  }

  query(input: Input): Output {
    return (this.trx as this["trxFunc"])(input.citekeys);
  }
}
