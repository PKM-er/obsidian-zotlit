import { eq, sql } from "drizzle-orm";
import { db } from "@/db/bbt";
import { citationkey as citationTable } from "@bbt/schema";

type Params = {
  citekey: string;
};

const statement = db
  .select({
    citekey: citationTable.citationKey,
    itemId: citationTable.itemId,
    libraryId: citationTable.libraryId,
  })
  .from(citationTable)
  .where(eq(citationTable.citationKey, sql.placeholder("citekey")))
  .prepare();

/**
 * Get the item IDs for given citekeys.
 * @param citekeys - The citekeys to get the item IDs for.
 * @returns A record of citekeys to items, with the item ID and library ID.
 */
export function getBibtexIds({
  citekeys,
}: {
  citekeys: string[];
}): Record<string, { itemId: string; libraryId: string }> {
  const items = citekeys
    .map((c) => statement.get({ citekey: c } satisfies Params))
    .filter((v) => !!v);

  return Object.fromEntries(
    items.map(({ citekey, itemId, libraryId }) => [
      citekey,
      { itemId, libraryId },
    ]),
  );
}
