import type { Transaction } from "@aidenlx/better-sqlite3";
import type { IDLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";

const query = `--sql
SELECT
  citekey
FROM
  citekeys
WHERE
  itemID = $itemID
  AND (libraryID IS NULL OR libraryID = $libId)
`;

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

export class BibtexGetCitekey extends PreparedBase<
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
    return query;
  }

  get(input: InputSql): OutputSql | undefined {
    return this.statement.get(input);
  }
  query(input: Input): Output {
    return (this.trx as BibtexGetCitekey["trxFunc"])(input.items);
  }
}
