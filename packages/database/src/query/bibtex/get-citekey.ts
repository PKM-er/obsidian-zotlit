import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/bbt";
import { citationkey as citationTable } from "@bbt/schema";

type Params = {
  itemId: string;
  libraryId: string;
};

const statement = db
  .select({
    citekey: citationTable.citationKey,
    itemId: citationTable.itemId,
  })
  .from(citationTable)
  .where(
    and(
      eq(citationTable.itemId, sql.placeholder("itemId")),
      or(
        eq(citationTable.libraryId, sql.placeholder("libraryId")),
        isNull(citationTable.libraryId),
      ),
    ),
  );

/**
 * Get the citekey for a given item ID and library ID.
 * @param items - The items to get the citekey for.
 * @param libId - The library ID to get the citekey for.
 * @returns A record of item IDs to citekeys.
 */
export function getBibtexCitekeys({
  items: inputs,
  libraryId,
}: { items: { itemId: string }[]; libraryId: string }): Record<string, string> {
  const citekeys = inputs
    .map((i) =>
      statement.get({
        itemId: i.itemId,
        libraryId,
      } satisfies Params),
    )
    .filter((v) => !!v);
  return Object.fromEntries(
    citekeys.map((citekey) => [citekey.itemId, citekey.citekey]),
  );
}
