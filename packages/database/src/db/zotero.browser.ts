import BrowserDatabaseManager from "./manager/browser";
import { schema, type ZoteroSchema } from "./schema/zotero";

const databaseManager = new BrowserDatabaseManager<ZoteroSchema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.zotero) {
  throw new Error("database filepath for zotero is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.zotero,
  force: true,
});

console.log("zotero db initialized:", DB_CONFIG.dbPaths.zotero);

export const db = databaseManager.get();
