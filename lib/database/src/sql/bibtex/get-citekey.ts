import type { Transaction } from "@aidenlx/better-sqlite3";
import type { IDLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import { BBT_MAIN_DB_NAME } from "./base.js";

interface InputSql {
  itemID: number;
  libId: number;
}

interface Input {
  items: IDLibID[];
}

interface OutputSql {
  citekey: string;
}
type Output = Record<number, string>;

const sqlMain = `--sql
SELECT
  citationkey as citekey
FROM
  ${BBT_MAIN_DB_NAME}.citationkey
WHERE
  itemID = $itemID
  AND (libraryID IS NULL OR libraryID = $libId)
`;

/**
 * Get Better BibTeX citation keys for items
 * For Zotero 6+ / Better BibTeX 6.0+
 */
export class BibtexGetCitekeyV1 extends PreparedBase<
  InputSql,
  OutputSql,
  Output
> {
  trxFunc = (items: IDLibID[]) =>
    items.reduce((rec, [itemID, libId]) => {
      const result = this.get({ itemID, libId });
      if (result) {
        rec[itemID] = result.citekey;
      }
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return sqlMain;
  }

  query(input: Input): Output {
    return (this.trx as this["trxFunc"])(input.items);
  }
}
