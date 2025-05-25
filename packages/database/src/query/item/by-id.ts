import { and, eq, sql } from "drizzle-orm";
import { items } from "@zt/schema";
import { parseItem } from "./_parse";
import { prepareItemQuery } from "./_sql";
import { getItemType } from "./_item-type";
import { db } from "@/db/zotero";
import { itemExists } from "../_where";

const statement = prepareItemQuery({
  where: and(
    eq(items.itemId, sql.placeholder("itemId")),
    itemExists(items.itemId),
  ),
});

type Params = {
  itemId: number;
};

export function getItemsById({ items }: { items: { itemId: number }[] }) {
  const result = db.transaction(() =>
    items
      .map(({ itemId }) =>
        parseItem(statement.all({ itemId } satisfies Params).at(0)),
      )
      .filter((v) => !!v)
      .map(({ itemTypeId, ...item }) => ({
        ...item,
        type: getItemType(itemTypeId),
      })),
  );
  return new Map(result.map((v) => [v.itemId, v]));
}
