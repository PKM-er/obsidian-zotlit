import type { Transaction } from "@aidenlx/better-sqlite3";
import { PreparedBase } from "../utils/index.js";

const query = `--sql
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
  sql(): string {
    return query;
  }

  get(input: InputSql): OutputSql {
    return this.statement.get(input);
  }

  query(input: Input): Output {
    const { itemIDs, libId } = input;
    const query = (this.trxCache[libId] ??= this.database.transaction(
      (itemIDs: number[]) =>
        itemIDs.reduce((rec, itemID) => {
          const { citekey } = this.get({ itemID, libId });
          rec[itemID] = citekey;
          return rec;
        }, {} as Output),
    ));
    return query(itemIDs);
  }
}
