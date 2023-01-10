import type { Transaction } from "@aidenlx/better-sqlite3";
import { checkItemID, PreparedBase } from "../../utils/index.js";
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
  AND ${checkItemID("items.itemID")}
`;

type OutputSql = WithParentItem<OutputBase>;
type Output = Record<string, Parsed<OutputSql>[]>;

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

  query(input: Input) {
    const { annotKeys, libId } = input;
    const query = (this.trxCache[libId] ??= this.database.transaction(
      (annotKeys: string[]) =>
        annotKeys.reduce((annotByKey, key) => {
          const result = this.runAll({ annotKey: key, libId });
          annotByKey[key] = result.map((o) => this.parse(o, input));
          return annotByKey;
        }, {} as Output),
    ));
    return query(annotKeys);
  }
}
