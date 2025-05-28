import workerCode from "inline:@zotlit/database/obsidian";
import type {
  initZotero,
  initBetterBibtex,
  init,
  getAllLibraries,
  getItemsById,
} from "@zotlit/database";
import { useWorkerFns } from "worker-fn";
import type { RemoteFns } from "@mys-x/m-rpc";

type DatabaseFns = RemoteFns<{
  init: typeof init;
  initZotero: typeof initZotero;
  initBetterBibtex: typeof initBetterBibtex;
  getAllLibraries: typeof getAllLibraries;
  getItemsById: typeof getItemsById;
}>;

import { join } from "node:path";
import type ZotLitPlugin from "./zt-main";

export class Database implements Disposable {
  fns: DatabaseFns;
  #worker: Worker;
  plugin;
  constructor(plugin: ZotLitPlugin) {
    this.plugin = plugin;
    using workerUrl = createWorkerURL(workerCode);
    this.#worker = new Worker(workerUrl.href, {
      type: "module",
      name: "Zotlit Database Worker",
    });
    // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
    this.fns = useWorkerFns(this.#worker);
  }

  [Symbol.dispose]() {
    this.#worker.terminate();
  }

  async init() {
    const { "database.zotero-data-dir": zoteroDataDir } =
      await this.plugin.settings.loaded;
    const manifest = this.plugin.manifest as unknown as {
      versions: Record<string, unknown>;
    };
    const dbDriverVersion = manifest.versions?.["better-sqlite3"];
    if (!dbDriverVersion || typeof dbDriverVersion !== "string") {
      throw new Error(
        "better-sqlite3 version is not specified in manifest.json",
      );
    }
    const dbDriverPath = join(
      require("@electron/remote").app.getPath("userData"),
      `better-sqlite3-${dbDriverVersion}.node`,
    );
    await this.fns.init({
      dbPaths: {
        zotero: join(zoteroDataDir, "zotero.sqlite"),
        betterBibtex: join(zoteroDataDir, "better-bibtex.sqlite"),
      },
      nativeBinding: dbDriverPath,
    });
    await this.fns.initZotero();
    try {
      await this.fns.initBetterBibtex();
    } catch (e) {
      console.error("Failed to load Better BibTeX database", e);
    }
  }
}

function createWorkerURL(code: string): { href: string } & Disposable {
  const blob = new Blob([code], { type: "text/javascript" });
  return {
    href: URL.createObjectURL(blob),
    [Symbol.dispose]() {
      URL.revokeObjectURL(this.href);
    },
  };
}
