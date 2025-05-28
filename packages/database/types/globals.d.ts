export interface DatabaseConfig {
  dbPaths: {
    zotero: string;
    betterBibtex: string;
  };
  nativeBinding?: string;
}

declare global {
  var DB_CONFIG: DatabaseConfig | undefined;
  var DB_ENV: "node" | "browser" | undefined;
}
