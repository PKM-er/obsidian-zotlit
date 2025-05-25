import { db } from "@/db/zotero";
import { sql } from "drizzle-orm";

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

type Params = {
  itemTypeId: number;
};

export function getItemType(itemTypeId: number) {
  return statement.get({ itemTypeId } satisfies Params);
}
