import type { DB } from "@obzt/zotero-type";
import type { Collection } from "../../item.js";
import { checkID, whereID } from "../../utils/database.js";

export const sql = (by: "key" | "id" | "full") => `--sql
WITH
  RECURSIVE CollectionPath AS (
    -- Base case: collections without a parent
    SELECT
      collectionID,
      parentCollectionID,
      collectionName AS path
    FROM
      collections
    WHERE
      libraryID = $libId
      ${
        by === "full"
          ? whereID(false)
          : by === "id"
          ? whereID("collectionID", "$collectionID")
          : whereID("key", "$key")
      }
      AND ${checkID("collectionID")}
    UNION ALL
    -- Recursive case: join with parent collections
    SELECT
      prev.collectionID,
      c.parentCollectionID,
      c.collectionName
    FROM
      collections c
      JOIN CollectionPath prev ON c.collectionID = prev.parentCollectionID
  )
SELECT
  p.collectionID,
  json_group_array(p.path) path,
  c.key,
  c.collectionName,
  c.libraryID
FROM
  CollectionPath p
  JOIN collections c USING (collectionID)
GROUP BY
  collectionID
ORDER BY
  collectionID;
`;

export interface OutputSql {
  collectionID: Exclude<DB.Collections["collectionID"], null>;
  path: string;
  key: DB.Collections["key"];
  collectionName: DB.Collections["collectionName"];
  libraryID: DB.Collections["libraryID"];
}

export function toParsed({
  collectionID: id,
  collectionName: name,
  path,
  ...val
}: OutputSql): Collection {
  return {
    ...val,
    id,
    name,
    path: JSON.parse(path) as string[],
  };
}
