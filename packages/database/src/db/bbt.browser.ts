import BrowserDatabaseManager from "./manager/browser";
import { schema, type BetterBibtexSchema } from "./schema/bbt";

const databaseManager = new BrowserDatabaseManager<BetterBibtexSchema>();

if (!DB_CONFIG || !DB_CONFIG.dbPaths.betterBibtex) {
  throw new Error("database filepath for better bibtex is not set");
}

databaseManager.init(schema, {
  filepath: DB_CONFIG.dbPaths.betterBibtex,
  force: true,
});

console.log("better bibtex db initialized:", DB_CONFIG.dbPaths.betterBibtex);

export const db = databaseManager.get();
