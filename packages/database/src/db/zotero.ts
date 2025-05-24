import * as ZoteroSchema from "@zt/schema";
import * as ZoteroRelations from "@zt/relations";
import DatabaseManager from "@/lib/db-manager";

const schema = { ...ZoteroSchema, ...ZoteroRelations };

const databaseManager = new DatabaseManager<typeof schema>();

const filepath = DB_CONFIG?.zotero_db;
if (!filepath) {
  throw new Error("database filepath for zotero is not set");
}

databaseManager.init(schema, {
  filepath,
  force: true,
});

console.log("zotero db initialized:", filepath);

export const db = databaseManager.get();
