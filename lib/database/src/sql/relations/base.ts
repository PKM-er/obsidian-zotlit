import type { ItemIDChecked } from "../../utils/index.js";
import { whereID, checkID } from "../../utils/index.js";

/**
 * Extract Zotero item key from URI or return original value if not a URI
 * This function is moved to JavaScript for better maintainability
 */
export function extractZoteroKey(objectValue: string): string {
  if (objectValue.includes('/items/')) {
    const itemsIndex = objectValue.indexOf('/items/');
    return objectValue.substring(itemsIndex + 7); // 7 = length of '/items/'
  }
  return objectValue;
}

/**
 * Simplified Relations query - gets raw relations without complex joins
 * Related item details are resolved in JavaScript for better performance
 */
export const sql = (full: boolean) => `--sql
SELECT
  itemRelations.itemID,
  itemRelations.object as relatedItemKey,
  relationPredicates.predicate as relationType
FROM
  items
  LEFT JOIN itemRelations USING (itemID)
  LEFT JOIN relationPredicates USING (predicateID)
WHERE
  items.libraryID = $libId
  ${whereID(full || "items.itemID")}
  AND ${checkID("items.itemID")}
  AND itemRelations.object IS NOT NULL
ORDER BY
  itemRelations.itemID,
  relationPredicates.predicate
`;

/**
 * Simplified Relations query result structure
 * Related item details are resolved separately in JavaScript
 */
export interface Output {
  /** ID of the source item that has the relation */
  itemID: ItemIDChecked;
  /** Raw relation object value (URI or key) */
  relatedItemKey: string;
  /** Type of relation (e.g., 'dc:relation', 'owl:sameAs') */
  relationType: string;
}

/**
 * Enhanced relation info with resolved related item details
 * Used by the application layer after key extraction and lookup
 */
export interface RelationInfo extends Output {
  /** Extracted Zotero key of the related item */
  relatedZoteroKey: string;
  /** Item ID of the related item (for citation key lookup) */
  relatedItemID: number | null;
  /** Library ID of the related item (for citation key lookup) */
  relatedLibraryID: number | null;
}
