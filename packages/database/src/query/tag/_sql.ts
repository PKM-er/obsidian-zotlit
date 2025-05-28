import { db } from "@db/zotero";
import type { SQL } from "drizzle-orm";

export function prepareTagQuery({
  where: whereClause,
}: { where: SQL | undefined }) {
  return db.query.tags
    .findMany({
      columns: { name: true, tagId: true },
      with: {
        itemTags: {
          columns: { type: true, itemId: true },
          with: { item: { columns: { key: true } } },
        },
      },
      where: whereClause,
    })
    .prepare();
}

export type TagQueryRawResult = Awaited<
  ReturnType<ReturnType<typeof prepareTagQuery>["all"]>
>[number];
