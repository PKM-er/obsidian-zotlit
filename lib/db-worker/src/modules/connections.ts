import type { LibraryInfo } from "@obzt/database";
import { AllLibraries } from "@obzt/database";
import type { DatabaseOptions, DatabasePaths } from "@obzt/database/api";
// import { use } from "to-use";
import log from "@log";
import Database from "./database";

export default class Connections {
  #instance: {
    zotero: Database;
    bbt: Database;
    libraries: Record<number, LibraryInfo>;
  } | null = null;

  get instance() {
    if (this.status === "READY") {
      return this.#instance;
    }
    return null;
  }

  get zotero() {
    if (!this.#instance) throw new Error("database not ready");
    return this.#instance.zotero;
  }
  get bbt() {
    if (!this.#instance) throw new Error("database not ready");
    return this.#instance.bbt;
  }

  status: DatabaseStatus = "NOT_INITIALIZED";

  checkDbStatus(name: "zotero" | "bbt"): boolean {
    if (!this.#instance) return false;
    return this.#instance[name].opened;
  }

  load(
    paths: DatabasePaths,
    opts: DatabaseOptions,
  ): [ztOpened: boolean, bbtOpened: boolean] {
    const db = {
      zotero: this.#instance?.zotero ?? new Database(),
      bbt: this.#instance?.bbt ?? new Database(),
    };
    try {
      const zoteroDbOpened = db.zotero.open({
        nativeBinding: opts.nativeBinding,
        file: paths.zotero,
      });
      if (!zoteroDbOpened) {
        throw new Error(
          `Failed to open main database, no database found at ${paths.zotero}`,
        );
      }
      const bbtDbOpened = db.bbt.open({
        nativeBinding: opts.nativeBinding,
        file: paths.bbt,
      });
      if (!bbtDbOpened) {
        log.debug(
          `Unable to open bbt database, no database found at ${paths.bbt}`,
        );
      }
      const libraries = db.zotero
        .prepare(AllLibraries)
        .query()
        .reduce(
          (rec, lib) => ((rec[lib.libraryID] = lib), rec),
          {} as Record<number, LibraryInfo>,
        );
      this.#instance = {
        ...db,
        libraries,
      };
      this.status = "READY";
      return [zoteroDbOpened, bbtDbOpened];
    } catch (error) {
      this.status = "ERROR";
      throw error;
    }
  }
  groupOf(library: number) {
    if (!this.#instance) throw new Error("Library info not loaded");
    return this.#instance.libraries[library].groupID;
  }
  get libraries() {
    if (!this.#instance) throw new Error("Library info not loaded");
    return Object.values(this.#instance.libraries);
  }
}

type DatabaseStatus = "READY" | "ERROR" | "NOT_INITIALIZED";
