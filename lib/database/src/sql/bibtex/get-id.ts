import type { Transaction } from "@aidenlx/better-sqlite3";
import { PreparedBase } from "../../utils/index.js";
import { BBT_MAIN_DB_NAME } from "./base.js";

const sqlMain = `--sql
SELECT
  itemID
FROM
  ${BBT_MAIN_DB_NAME}.citationkey
WHERE
  citationkey = $citekey
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

/**
 * Get item IDs from Better BibTeX citation keys
 * For Zotero 6+ / Better BibTeX 6.0+
 */
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
