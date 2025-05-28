import { defineWorkerFns } from "worker-fn";
import type { DatabaseConfig } from "../types/globals";

export function init(config: DatabaseConfig) {
  globalThis.DB_CONFIG = config;
  globalThis.DB_ENV = "node";
}

export async function initZotero() {
  void (await import("@/db/zotero.node"));
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
  void (await import("@/db/bbt.node"));
  defineWorkerFns({
    ...(await import("@/query/bibtex")),
  });
}

defineWorkerFns({
  init,
  initZotero,
  initBetterBibtex,
});
