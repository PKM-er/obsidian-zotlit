import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@db/bbt";
import { citationkey as citationTable } from "@bbt/schema";
import * as v from "valibot";

const ParamsSchema = v.object({
  itemId: v.string(),
  libraryId: v.string(),
});

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
export async function getBibtexCitekeys({
  items: inputs,
  libraryId,
}: { items: { itemId: string }[]; libraryId: string }): Promise<
  Map<number, string>
> {
  return new Map(
    (
      await Promise.all(
        inputs.map((i) =>
          statement.get(v.parse(ParamsSchema, { itemId: i.itemId, libraryId })),
        ),
      )
    )
      .filter((v) => !!v)
      .map((v) => [v.itemId, v.citekey]),
  );
}
