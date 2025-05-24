import * as schema from "@bbt/schema";
import DatabaseManager from "@/lib/db-manager";

const databaseManager = new DatabaseManager<typeof schema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.betterBibtex) {
  throw new Error("database filepath for bbt is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.betterBibtex,
  force: true,
  nativeBinding: DB_CONFIG.nativeBinding,
});

console.log("bbt db initialized:", DB_CONFIG.dbPaths.betterBibtex);

export const db = databaseManager.get();
