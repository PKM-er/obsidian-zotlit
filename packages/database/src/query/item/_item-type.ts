import { db } from "@db/zotero";
import { sql } from "drizzle-orm";
import * as v from "valibot";

const statement = db.query.itemTypesCombined
  .findFirst({
    columns: {
      typeName: true,
      display: true,
      custom: true,
      itemTypeId: true,
    },
    where: (table, { eq }) =>
      eq(table.itemTypeId, sql.placeholder("itemTypeId")),
  })
  .prepare();

const ParamsSchema = v.object({
  itemTypeId: v.number(),
});

export async function getItemType({ itemTypeId }: { itemTypeId: number }) {
  return await statement.get(v.parse(ParamsSchema, { itemTypeId }));
}
