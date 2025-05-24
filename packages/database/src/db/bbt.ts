import * as schema from "@bbt/schema";
import DatabaseManager from "@/lib/db-manager";

const databaseManager = new DatabaseManager<typeof schema>();

const filepath = DB_CONFIG?.bbt_db;
if (!filepath) {
  throw new Error("database filepath for bbt is not set");
}

databaseManager.init(schema, {
  filepath,
  force: true,
});

console.log("bbt db initialized:", filepath);

export const db = databaseManager.get();
