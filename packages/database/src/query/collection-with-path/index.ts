import { db } from "@/db/zotero";
import type Client from "better-sqlite3";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { sql, type Params, type Result } from "./sql";

const statement = ((client: Client.Database) => {
  const sqliteDialect = new SQLiteSyncDialect();
  const query = sqliteDialect.sqlToQuery(sql);
  const stmt = client.prepare<Params, Result>(query.sql);

  return client.transaction((collectionIds: number[]) =>
    collectionIds.map((id) => stmt.get({ id })).filter((v) => !!v),
  );
})(db.$client);

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
export default function queryCollectionPath(
  collections: { id: number }[],
): Map<number, string[]> {
  const result = statement(collections.map((v) => v.id));
  return new Map(
    result.map(({ path, ...rest }) => [
      rest.id,
      (JSON.parse(path) as string[]).toReversed(),
    ]),
  );
}
