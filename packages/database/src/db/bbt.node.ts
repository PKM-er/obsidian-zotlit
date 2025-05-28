import NodeDatabaseManager from "./manager/node";
import { schema, type BetterBibtexSchema } from "./schema/bbt";

const databaseManager = new NodeDatabaseManager<BetterBibtexSchema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.betterBibtex) {
  throw new Error("database filepath for better bibtex is not set");
}
if (!DB_CONFIG.nativeBinding) {
  throw new Error("native binding for sqlite3 is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.betterBibtex,
  force: true,
  nativeBinding: DB_CONFIG.nativeBinding,
});

console.log("better bibtex db initialized:", DB_CONFIG.dbPaths.betterBibtex);

export const db = databaseManager.get();
