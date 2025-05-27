import { defineWorkerFns } from "worker-fn";

export interface DatabaseConfig {
  dbPaths: {
    zotero: string;
    betterBibtex: string;
  };
  nativeBinding: string;
}

declare global {
  var DB_CONFIG: DatabaseConfig | undefined;
}

export function init(config: DatabaseConfig) {
  self.DB_CONFIG = config;
}

export async function initZotero() {
  void (await import("@/db/zotero"));
  defineWorkerFns({
    ...(await import("@/query/annotation")),
    ...(await import("@/query/collection")),
    ...(await import("@/query/library")),
    ...(await import("@/query/item")),
    ...(await import("@/query/tag")),
    ...(await import("@/query/note")),
  });
}

export async function initBetterBibtex() {
  void (await import("@/db/bbt"));
  defineWorkerFns({
    ...(await import("@/query/bibtex")),
  });
}

defineWorkerFns({
  init,
  initZotero,
  initBetterBibtex,
});
