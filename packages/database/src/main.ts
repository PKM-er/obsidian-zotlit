import { defineWorkerFns } from "worker-fn";

declare global {
  var DB_CONFIG: { zotero_db: string; bbt_db: string } | undefined;
}

export async function initZotero() {
  void (await import("@/db/zotero"));
  defineWorkerFns({
    ...(await import("@/query/annotation")),
    ...(await import("@/query/collection")),
    ...(await import("@/query/library")),
  });
}

export async function initBetterBibtex() {
  void (await import("@/db/bbt"));
  defineWorkerFns({
    ...(await import("@/query/bibtex")),
  });
}

defineWorkerFns({
  initZotero,
  initBetterBibtex,
});
