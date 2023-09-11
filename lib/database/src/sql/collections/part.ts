import type { Transaction } from "@aidenlx/better-sqlite3";
import type { Collection } from "../../item.js";
import type { IDLibID, KeyLibID } from "../../utils/index.js";
import { PreparedBase } from "../../utils/index.js";
import type { OutputSql } from "./base.js";
import { sql, toParsed } from "./base.js";

const queryByID = sql("id"),
  queryByKey = sql("key");

interface Input {
  libId: number;
  collectionID: number;
}

type IDCollectionMap = Map<number, Collection>;

export class Collections extends PreparedBase<
  Input,
  OutputSql,
  IDCollectionMap
> {
  trxFunc = (ids: IDLibID[]) =>
    ids.reduce((rec, [collectionID, libId]) => {
      const result = this.get({
        collectionID,
        libId,
      }) as OutputSql | null;
      if (result) {
        rec.set(collectionID, toParsed(result));
      }
      return rec;
    }, new Map() as IDCollectionMap);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByID;
  }

  query(itemIDs: IDLibID[]) {
    return (this.trx as this["trxFunc"])(itemIDs);
  }
}

interface InputByKey {
  libId: number;
  key: string;
}

type KeyCollectionMap = Map<string, Collection>;

export class CollectionsByKey extends PreparedBase<
  InputByKey,
  OutputSql,
  KeyCollectionMap
> {
  trxFunc = (itemKeys: KeyLibID[]) =>
    itemKeys.reduce((rec, [key, libId]) => {
      const result = this.get({ key, libId });
      if (result) {
        rec.set(key, toParsed(result));
      }
      return rec;
    }, new Map() as KeyCollectionMap);
  trx: Transaction = this.database.transaction(this.trxFunc);

  sql(): string {
    return queryByKey;
  }

  query(itemKeys: KeyLibID[]) {
    return (this.trx as this["trxFunc"])(itemKeys);
  }
}
