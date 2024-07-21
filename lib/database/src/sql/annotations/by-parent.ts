import type { Statement } from "@aidenlx/better-sqlite3";
import { checkID, PreparedWithParser } from "../../utils/index.js";
import { sortBySortIndex } from "../../utils/misc.js";
import type { Parsed, OutputBase, WithParentItem } from "./base.js";
import { toParsed, from, select } from "./base.js";

const query = `--sql
SELECT
  ${select}
FROM
  ${from}
WHERE
  parentItemID = $attachmentId
  AND items.libraryID = $libId
  AND ${checkID()}
`;

interface Input {
  attachmentId: number;
  libId: number;
  groupID: number | null;
}
type OutputSql = OutputBase;
type Output = WithParentItem<Parsed<OutputBase>>;

export class AnnotByParent extends PreparedWithParser<
  OutputSql,
  Output,
  Input
> {
  sql(): string {
    return query;
  }

  getKeyStatement: Statement<Input, Pick<OutputSql, "key">> =
    this.database.prepare(
      `SELECT key FROM items WHERE itemID = $attachmentId AND libraryID = $libId`
    );
  protected parse(
    output: OutputSql,
    input: Input,
    parentItemKey: string
  ): Output {
    return Object.assign(toParsed(output, input.libId, input.groupID), {
      parentItem: parentItemKey,
      parentItemID: input.attachmentId,
    });
  }
  query(input: Input): Output[] {
    const parentItemKey = this.getKeyStatement.get(input)?.key;
    if (parentItemKey === undefined) {
      throw new Error("Parent item not found");
    }
    return this.all(input)
      .map((output) => this.parse(output, input, parentItemKey))
      .sort((a, b) => sortBySortIndex(a.sortIndex, b.sortIndex));
  }
}
