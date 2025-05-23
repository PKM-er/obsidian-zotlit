import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { citationkey as citationTable } from "@bbt/schema";

/**
 * Get the citekey for a given item ID and library ID.
 * @param items - The items to get the citekey for.
 * @param libId - The library ID to get the citekey for.
 * @returns A record of item IDs to citekeys.
 */
export async function getBibtexCitekeys({
  items: inputs,
  libraryId,
}: { items: { itemId: string }[]; libraryId: string }): Promise<
  Record<string, string>
> {
  const citekeys = await db("zt")
    .select({
      citekey: citationTable.citationKey,
      itemId: citationTable.itemId,
    })
    .from(citationTable)
    .where(
      and(
        inArray(
          citationTable.itemId,
          inputs.map((item) => item.itemId),
        ),
        or(
          eq(citationTable.libraryId, libraryId),
          isNull(citationTable.libraryId),
        ),
      ),
    );
  return Object.fromEntries(
    citekeys.map((citekey) => [citekey.itemId, citekey.citekey]),
  );
}

/**
 * Get the item IDs for given citekeys.
 * @param citekeys - The citekeys to get the item IDs for.
 * @returns A record of citekeys to items, with the item ID and library ID.
 */
export async function getBibtexIds({
  citekeys,
}: {
  citekeys: string[];
}): Promise<Record<string, { itemId: string; libraryId: string }>> {
  const items = await db("zt")
    .select({
      citekey: citationTable.citationKey,
      itemId: citationTable.itemId,
      libraryId: citationTable.libraryId,
    })
    .from(citationTable)
    .where(inArray(citationTable.citationKey, citekeys));

  return Object.fromEntries(
    items.map(({ citekey, itemId, libraryId }) => [
      citekey,
      { itemId, libraryId },
    ]),
  );
}
