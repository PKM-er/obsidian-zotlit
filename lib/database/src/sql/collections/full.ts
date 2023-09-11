import type { Collection } from "../../item.js";
import { PreparedBase } from "../../utils/index.js";
import { sql, type OutputSql, toParsed } from "./base.js";

type IDCollectionMap = Map<number, Collection>;

const query = sql("full");

type Input = { libId: number };

export class CollectionsFull extends PreparedBase<
  Input,
  OutputSql,
  IDCollectionMap
> {
  sql(): string {
    return query;
  }
  query(input: Input) {
    return new Map(
      this.all(input).map((v) => [v.collectionID, toParsed(v)]),
    );
  }
}
