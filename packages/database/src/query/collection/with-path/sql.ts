import { collections } from "@zt/schema";
import { eq, sql } from "drizzle-orm";
import * as v from "valibot";

// use drizzle native method when https://github.com/drizzle-team/drizzle-orm/issues/209 lands
const collectionsWithPathTable = sql.raw('"collectionsWithPath"');

export type Result = {
  id: number;
  path: string;
};
export const ParamsSchema = v.object({
  id: v.number(),
});
export type Params = v.InferOutput<typeof ParamsSchema>;

export { pathQuerySql as sql };

const pathQuerySql = sql`
WITH
  RECURSIVE ${collectionsWithPathTable} AS (
    -- Base case: collections without a parent
    SELECT
      ${collections.collectionId} as id,
      ${collections.parentCollectionId} as parentId,
      ${collections.collectionName} AS name
    FROM
      ${collections}
    WHERE
      -- named parameters here
      ${eq(collections.collectionId, sql.placeholder("id"))}
    UNION ALL
    -- Recursive case: join with parent collections
    SELECT
      ${collectionsWithPathTable}.id as id,
      ${collections.parentCollectionId} as parentId,
      ${collections.collectionName} AS name
    FROM
      ${collections}
      JOIN ${collectionsWithPathTable} 
      ON ${collections.collectionId} = ${collectionsWithPathTable}.parentId
  )
  SELECT 
    id,
    json_group_array(name) as path
  FROM
    ${collectionsWithPathTable}
  GROUP BY
    id
  ORDER BY
    id
`;
