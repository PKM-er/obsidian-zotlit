import { sql } from "drizzle-orm";
import { check, index, numeric, sqliteTable } from "drizzle-orm/sqlite-core";

export const citationkey = sqliteTable(
  "citationkey",
  {
    itemId: numeric({ mode: "number" }).primaryKey().notNull(),
    itemKey: numeric().notNull(),
    libraryId: numeric({ mode: "number" }).notNull(),
    citationKey: numeric().notNull(),
    pinned: numeric(),
  },
  (table) => [
    index("citationkey_citationkey").on(table.citationKey),
    index("citationkey_libraryID_itemKey").on(table.libraryId, table.itemKey),
    index("citationkey_itemKey").on(table.itemKey),
    check("citationkey_check_1", sql`citationKey <> ''`),
    check("citationkey_check_2", sql`pinned in (0, 1`),
  ],
);
