import { PreparedBase } from "../../utils/index.js";
import type { Output, OutputSql } from "./base.js";
import { sql } from "./base.js";

const query = sql("full");
interface Input {
  libId: number;
}

export class ItemsFull extends PreparedBase<Input, OutputSql, Output[]> {
  sql(): string {
    return query;
  }
  query(input: Input) {
    const result = this.all(input);
    return result.map(({ collectionIDs, ...rest }) => ({
      ...rest,
      collectionIDs: JSON.parse(collectionIDs) as number[],
    }));
  }
}
