import { eq, sql } from "drizzle-orm";
import { db } from "@/db/bbt";
import { citationkey as citationTable } from "@bbt/schema";
import * as v from "valibot";

const paramSchema = v.object({
  citekey: v.pipe(v.string(), v.trim(), v.toLowerCase()),
});

// Using lower() to perform a case-insensitive search on citation keys
const statement = db
  .select({
    citekey: citationTable.citationKey,
    itemId: citationTable.itemId,
    libraryId: citationTable.libraryId,
  })
  .from(citationTable)
  .where(
    eq(sql`lower(${citationTable.citationKey})`, sql.placeholder("citekey")),
  )
  .prepare();

/**
 * Retrieves item and library IDs for a given list of BibTeX citation keys.
 * This function performs a case-insensitive search by comparing lowercase versions of
 * the input citekeys and the citekeys stored in the database.
 *
 * @param citekeys - An array of citation keys to search for. Each key in the input
 *                   array will be trimmed and converted to lowercase before being used
 *                   in the database query.
 * @returns A \`Map<string, { itemId: number; libraryId: number }>\`.
 *          The keys of the map are the citation keys as they are stored in the database
 *          (i.e., preserving their original casing from the database) that matched an input citekey.
 *          The values are objects containing the corresponding \`itemId\` and \`libraryId\`.
 *          Citekeys from the input array that are not found in the database will not
 *          be included in the returned map.
 */
export function getItemsFromBibtexCitekey({
  citekeys,
}: {
  citekeys: string[];
}): Map<string, { itemId: number; libraryId: number; citekey: string }> {
  const params = citekeys.map((citekey) => v.parse(paramSchema, { citekey }));
  const items = citekeys
    .map((citekey) => statement.get(v.parse(paramSchema, { citekey })))
    .filter((v) => !!v);

  console.log(params, items);
  return new Map(
    items.map(({ citekey, itemId, libraryId }) => [
      citekey,
      { itemId, libraryId, citekey },
    ]),
  );
}
