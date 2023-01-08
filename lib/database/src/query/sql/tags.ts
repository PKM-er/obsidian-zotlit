import type { Transaction } from "@aidenlx/better-sqlite3";
import type { DB } from "@obzt/zotero-type";
import { PreparedBase } from "../utils";

const query = `--sql
SELECT
  tagID,
  type,
  name
FROM
  itemTags
  JOIN items USING (itemID)
  JOIN tags USING (tagID)
WHERE
  itemID = $itemId
  AND tagID IS NOT NULL
  AND libraryID = $libId
`;

interface Input {
  itemId: number;
  libId: number;
}

interface OutputSql {
  tagID: Exclude<DB.Tags["tagID"], null>;
  type: DB.ItemTags["type"];
  name: DB.Tags["name"];
}

type Output = Record<number, OutputSql[]>;

export class Tags extends PreparedBase<Input, OutputSql, Output> {
  trxCache: Record<number, Transaction> = {};
  sql(): string {
    return query;
  }

  query({ itemIds, libId }: { itemIds: number[]; libId: number }) {
    const query = (this.trxCache[libId] ??= this.database.transaction(
      (itemIds: number[]) =>
        itemIds.reduce(
          (tagsByItem, itemId) => (
            (tagsByItem[itemId] = this.runAll({ itemId, libId })), tagsByItem
          ),
          {} as Output,
        ),
    ));
    return query(itemIds);
  }
}
