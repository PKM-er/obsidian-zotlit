import { and, isNotNull, notInArray, type SQL } from "drizzle-orm";
import { deletedItems } from "@zt/schema";
import { db } from "@/db";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

/**
 * Checks if an item exists by verifying that:
 * 1. The item ID is not null
 * 2. The item ID is not in the deletedItems table
 *
 * @param idCol - The SQL column reference to check for existence
 * @returns A SQL condition that evaluates to true if the item exists
 *
 * @example
 * ```sql
 * SELECT * FROM items
 * WHERE items.id IS NOT NULL
 * AND items.id NOT IN (SELECT itemId FROM deletedItems)
 * ```
 */
export function itemExists(idCol: SQLiteColumn) {
  return and(
    isNotNull(idCol),
    notInArray(
      idCol,
      db("zt")
        .select({
          itemId: deletedItems.itemId,
        })
        .from(deletedItems),
    ),
  );
}
