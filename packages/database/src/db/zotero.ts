import * as ZoteroSchema from "@zt/schema";
import * as ZoteroRelations from "@zt/relations";
import DatabaseManager from "@/lib/db-manager";

const schema = { ...ZoteroSchema, ...ZoteroRelations };

const databaseManager = new DatabaseManager<typeof schema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.zotero) {
  throw new Error("database filepath for zotero is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.zotero,
  force: true,
  nativeBinding: DB_CONFIG.nativeBinding,
});

console.log("zotero db initialized:", DB_CONFIG.dbPaths.zotero);

export const db = databaseManager.get();
