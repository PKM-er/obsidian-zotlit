import { db } from "@/db";
import { collections } from "@zt/schema";
import { sql, type SQL } from "drizzle-orm";

interface QueryCollectionPathParams {
  where: (collectionsTable: typeof collections) => SQL;
}

interface QueryCollectionPathResult {
  id: number;
  path: string;
}

// use drizzle native method when https://github.com/drizzle-team/drizzle-orm/issues/209 lands
function builder({ where }: QueryCollectionPathParams) {
  const collectionsWithPath = sql.raw('"collectionsWithPath"');
  return sql`
WITH
  RECURSIVE ${collectionsWithPath} AS (
    -- Base case: collections without a parent
    SELECT
      ${collections.collectionId} as id,
      ${collections.parentCollectionId} as parentId,
      ${collections.collectionName} AS name
    FROM
      ${collections}
    WHERE
      ${where(collections)}
    UNION ALL
    -- Recursive case: join with parent collections
    SELECT
      ${collectionsWithPath}.id as id,
      ${collections.parentCollectionId} as parentId,
      ${collections.collectionName} AS name
    FROM
      ${collections}
      JOIN ${collectionsWithPath} 
      ON ${collections.collectionId} = ${collectionsWithPath}.parentId
  )
  SELECT 
    id,
    json_group_array(name) as path
  FROM
    ${collectionsWithPath}
  GROUP BY
    id
  ORDER BY
    id
`;
}

/**
 * Queries collection paths using a recursive CTE to build hierarchical paths.
 *
 * This function traverses the collection hierarchy from child to parent collections
 * and constructs the full path for each collection that matches the given criteria.
 * The paths are returned as arrays of collection names, ordered from root to leaf.
 *
 * @param params - Query parameters
 * @param params.where - SQL WHERE clause to filter collections. If undefined, all collections are included.
 * @returns A record mapping collection IDs to their hierarchical paths as string arrays.
 *          Each path array contains collection names ordered from root (index 0) to the target collection.
 *
 * @example
 * ```typescript
 * // Get paths for all collections
 * const allPaths = queryCollectionPath({ where: undefined });
 * // Result: { 1: ["Root"], 2: ["Root", "Subfolder"], 3: ["Root", "Subfolder", "Deep"] }
 *
 * // Get path for a specific collection
 * const specificPath = queryCollectionPath({
 *   where: sql`${collections.collectionId} = 2`
 * });
 * // Result: { 2: ["Root", "Subfolder"] }
 * ```
 */
export function queryCollectionPath({
  where,
}: QueryCollectionPathParams): Map<number, string[]> {
  const result = db("zt").all<QueryCollectionPathResult>(builder({ where }));
  return new Map(
    result.map(({ path, ...rest }) => [
      rest.id,
      (JSON.parse(path) as string[]).toReversed(),
    ]),
  );
}
