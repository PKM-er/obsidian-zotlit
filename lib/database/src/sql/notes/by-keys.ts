import type { Transaction } from "@aidenlx/better-sqlite3";
import { checkID, PreparedBase } from "../../utils/index.js";
import type { OutputBase, Parsed, WithParentItem } from "./base.js";
import { from, select, toParsed } from "./base.js";

const query = `--sql
SELECT
  ${select},
  notes.parentItemID,
  parentItems.key as parentItem
FROM
  ${from}
  JOIN items as parentItems ON notes.parentItemID = parentItems.itemID
WHERE
  items.key = $noteKey
  AND items.libraryID = $libId
  AND ${checkID("items.itemID")}
`;

type OutputSql = WithParentItem<OutputBase>;
type Output = Record<string, Parsed<OutputSql>>;

interface InputSql {
  noteKey: string;
  libId: number;
}

interface Input {
  noteKeys: string[];
  libId: number;
  groupID: number | null;
}

export class NoteByKeys extends PreparedBase<InputSql, OutputSql, Output> {
  trxCache: Record<number, Transaction> = {};
  sql(): string {
    return query;
  }

  parse(o: OutputSql, input: Input): Parsed<OutputSql> {
    return toParsed(o, input.libId, input.groupID);
  }

  query(input: Input): Output {
    const { noteKeys, libId } = input;
    const queryFunc = (noteKeys: string[]) =>
      noteKeys.reduce((noteByKey, key) => {
        const result = this.get({ noteKey: key, libId });
        if (result) noteByKey[key] = this.parse(result, input);
        return noteByKey;
      }, {} as Output);
    const query = (this.trxCache[libId] ??=
      this.database.transaction(queryFunc)) as typeof queryFunc;
    return query(noteKeys);
  }
}
