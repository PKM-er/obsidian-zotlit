import type { Database, Statement, Transaction } from "@aidenlx/better-sqlite3";
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
  itemIDs: number[];
  libId: number;
}

interface OutputSql {
  citekey: string;
}
type Output = Record<number, string>;

export class BetterBibtex extends PreparedBase<InputSql, OutputSql, Output> {
  trxCache: Record<number, Transaction> = {};

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
    const { itemIDs, libId } = input;
    const get = libId === 1 ? this.getMainLib : this.getAltLib;
    const query = (this.trxCache[libId] ??= this.database.transaction(
      (itemIDs: number[]) =>
        itemIDs.reduce((rec, itemID) => {
          const result = get.call(this, { itemID, libId });
          if (!result) return rec;
          rec[itemID] = result.citekey;
          return rec;
        }, {} as Output),
    ));
    return query(itemIDs);
  }
}
