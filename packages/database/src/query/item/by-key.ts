import { and, eq, sql } from "drizzle-orm";
import { items } from "@zt/schema";
import { parseItem } from "./_parse";
import { prepareItemQuery } from "./_sql";
import { getItemType } from "./_item-type";
import { db } from "@/db/zotero";
import { itemExists } from "../_where";

const statement = prepareItemQuery({
  where: and(eq(items.key, sql.placeholder("key")), itemExists(items.itemId)),
});

type Params = {
  key: string;
};

export function getItemsByKey({ items }: { items: { key: string }[] }) {
  const result = db.transaction(() =>
    items
      .map(({ key }) =>
        parseItem(statement.all({ key } satisfies Params).at(0)),
      )
      .filter((v) => !!v)
      .map(({ itemTypeId, ...item }) => ({
        ...item,
        type: getItemType(itemTypeId),
      })),
  );
  return new Map(result.map((v) => [v.itemId, v]));
}
