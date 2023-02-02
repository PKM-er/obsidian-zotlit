import type { Database, Statement, Transaction } from "@aidenlx/better-sqlite3";
import type { ItemIDLibID } from "../utils/index.js";
import { PreparedBase } from "../utils/index.js";

const queryMainLib = `--sql
SELECT
  citekey
FROM
  citekeys
WHERE
  itemID = $itemID
  AND libraryID IS NULL
`;

const queryAltLib = `--sql
SELECT
  citekey
FROM
  citekeys
WHERE
  itemID = $itemID
  AND libraryID = $libId
`;

interface InputSql {
  itemID: number;
  libId: number;
}

interface Input {
  items: ItemIDLibID[];
}

interface OutputSql {
  citekey: string;
}
type Output = Record<number, string>;

export class BetterBibtex extends PreparedBase<InputSql, OutputSql, Output> {
  trxFunc = (items: ItemIDLibID[]) =>
    items.reduce((rec, [itemID, libId]) => {
      const input = { itemID, libId };
      const result =
        libId === 1 ? this.getMainLib(input) : this.getAltLib(input);
      if (result) {
        rec[itemID] = result.citekey;
      }
      return rec;
    }, {} as Output);
  trx: Transaction = this.database.transaction(this.trxFunc);

  statementAltLib: Statement;
  constructor(database: Database) {
    super(database);
    this.statementAltLib = this.database.prepare(queryAltLib);
  }
  sql(): string {
    return queryMainLib;
  }

  getMainLib(input: InputSql): OutputSql | undefined {
    return this.statement.get(input);
  }
  getAltLib(input: InputSql): OutputSql | undefined {
    return this.statementAltLib.get(input);
  }

  query(input: Input): Output {
    return (this.trx as BetterBibtex["trxFunc"])(input.items);
  }
}
