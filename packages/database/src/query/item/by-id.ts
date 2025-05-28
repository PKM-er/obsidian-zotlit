import { and, eq, sql } from "drizzle-orm";
import { items } from "@zt/schema";
import { parseItem } from "./_parse";
import { prepareItemQuery } from "./_sql";
import { getItemType } from "./_item-type";
import { itemExists } from "../_where";
import * as v from "valibot";

const statement = prepareItemQuery({
  where: and(
    eq(items.itemId, sql.placeholder("itemId")),
    itemExists(items.itemId),
  ),
});

const ParamsSchema = v.object({
  itemId: v.number(),
});

export async function getItemsById({ items }: { items: { itemId: number }[] }) {
  const values = await Promise.all(
    items.map(async ({ itemId }) => {
      const item = parseItem(
        (await statement.all(v.parse(ParamsSchema, { itemId }))).at(0),
      );
      if (!item) return null;
      const { itemTypeId, ...rest } = item;
      return { ...rest, type: await getItemType({ itemTypeId }) };
    }),
  );
  return new Map(values.filter((v) => !!v).map((v) => [v.itemId, v]));
}
