import type { Transaction } from "@aidenlx/better-sqlite3";
import { checkID, PreparedBase } from "../../utils/index.js";
import type { OutputBase, Parsed, WithParentItem } from "./base.js";
import { toParsed, from, select } from "./base.js";

const query = `--sql
SELECT
  ${select},
  annots.parentItemID,
  parentItems.key as parentItem
FROM
  ${from}
  JOIN items as parentItems ON annots.parentItemID = parentItems.itemID
WHERE
  items.key = $annotKey
  AND items.libraryID = $libId
  AND ${checkID("items.itemID")}
`;

type OutputSql = WithParentItem<OutputBase>;
type Output = Record<string, Parsed<OutputSql>>;

interface InputSql {
  annotKey: string;
  libId: number;
}

interface Input {
  annotKeys: string[];
  libId: number;
  groupID: number | null;
}

export class AnnotByKeys extends PreparedBase<InputSql, OutputSql, Output> {
  trxCache: Record<number, Transaction> = {};
  sql(): string {
    return query;
  }

  parse(o: OutputSql, input: Input): Parsed<OutputSql> {
    return toParsed(o, input.libId, input.groupID);
  }

  query(input: Input): Output {
    const { annotKeys, libId } = input;
    const queryFunc = (annotKeys: string[]) =>
      annotKeys.reduce((annotByKey, key) => {
        const result = this.statement.get({ annotKey: key, libId });
        if (result) annotByKey[key] = result;
        return annotByKey;
      }, {} as Output);
    const query = (this.trxCache[libId] ??=
      this.database.transaction(queryFunc)) as typeof queryFunc;
    return query(annotKeys);
  }
}
