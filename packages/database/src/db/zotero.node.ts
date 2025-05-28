import NodeDatabaseManager from "./manager/node";
import { schema, type ZoteroSchema } from "./schema/zotero";

const databaseManager = new NodeDatabaseManager<ZoteroSchema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.zotero) {
  throw new Error("database filepath for zotero is not set");
}
if (!DB_CONFIG.nativeBinding) {
  throw new Error("native binding for sqlite3 is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.zotero,
  force: true,
  nativeBinding: DB_CONFIG.nativeBinding,
});

console.log("zotero db initialized:", DB_CONFIG.dbPaths.zotero);

export const db = databaseManager.get();
