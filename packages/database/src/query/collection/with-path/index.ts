import { db } from "@db/zotero";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { sql, type Params, type Result } from "./sql";
import type { NodeDrizzleDatabase } from "@/db/manager/node";
import type { ZoteroSchema } from "@/db/schema/zotero";
import type { BrowserDrizzleDatabase } from "@/db/manager/browser";

const prepareNode = (db: NodeDrizzleDatabase<ZoteroSchema>) => {
  const client = db.$client;
  const sqliteDialect = new SQLiteSyncDialect();
  const query = sqliteDialect.sqlToQuery(sql);
  const stmt = client.prepare<[number], Result>(query.sql);

  return client.transaction((collectionIds: number[]) =>
    collectionIds.map((id) => stmt.get(id)).filter((v) => !!v),
  );
};

const prepareBrowser = (db: BrowserDrizzleDatabase<ZoteroSchema>) => {
  const sqliteDialect = new SQLiteSyncDialect();
  const query = sqliteDialect.sqlToQuery(sql);
  // sqlocal doesn't expose prepare method, so we query the db directly
  return async (collectionIds: number[]) => {
    const results: Result[] = [];
    for (const id of collectionIds) {
      const result = await db.$client.sql(query.sql, id);
      results.push(...(result as Result[]));
    }
    return results;
  };
};

const statement =
  self.DB_ENV === "browser" ? prepareBrowser(db) : prepareNode(db as any);

/**
 * Queries collection paths using a recursive CTE to build hierarchical paths.
 *
 * This function traverses the collection hierarchy from child to parent collections
 * and constructs the full path for each collection that matches the given criteria.
 * The paths are returned as arrays of collection names, ordered from root to leaf.
 *
 * @param params - Query parameters
 * @returns A record mapping collection IDs to their hierarchical paths as string arrays.
 *          Each path array contains collection names ordered from root (index 0) to the target collection.
 * ```
 */
export default async function queryCollectionPath(
  collections: { id: number }[],
): Promise<Map<number, string[]>> {
  const result = await statement(collections.map((v) => v.id));
  return new Map(
    result.map(({ path, ...rest }) => [
      rest.id,
      (JSON.parse(path) as string[]).toReversed(),
    ]),
  );
}
