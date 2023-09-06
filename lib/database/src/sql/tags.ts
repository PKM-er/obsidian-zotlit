import type { Transaction } from "@aidenlx/better-sqlite3";
import { fromPairs } from "@mobily/ts-belt/Dict";
import type { DB } from "@obzt/zotero-type";
import type { IDLibID } from "../utils/index.js";
import { PreparedBase } from "../utils/index.js";

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

export interface OutputSql {
  tagID: Exclude<DB.Tags["tagID"], null>;
  type: DB.ItemTags["type"];
  name: DB.Tags["name"];
}

type Output = Record<number, OutputSql[]>;

export class Tags extends PreparedBase<Input, OutputSql, Output> {
  trxFunc = (itemIds: IDLibID[]) =>
    itemIds.map(
      ([itemId, libId]) => [itemId, this.runAll({ itemId, libId })] as const,
    );
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return query;
  }

  query(items: IDLibID[]): Output {
    return fromPairs((this.trx as Tags["trxFunc"])(items));
  }
}
