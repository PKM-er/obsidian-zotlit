import type { IDLibID, LibraryInfo } from "@obzt/database";
import {
  AllLibraries,
  BBT_MAIN_DB_NAME,
  BBT_SEARCH_DB_NAME,
  BibtexGetCitekeyV0,
  BibtexGetCitekeyV1,
  BibtexGetIdV0,
  BibtexGetIdV1,
} from "@obzt/database";
import type {
  BBTLoadStatus,
  DatabaseOptions,
  DatabasePaths,
  LoadStatus,
} from "@obzt/database/api";
// import { use } from "to-use";
import log from "@log";
import Database, { DatabaseNotSetError } from "./database";

function isBBTAfterMigration(db: Database) {
  return db.tableExists("citationkey", BBT_MAIN_DB_NAME);
}

export default class Connections {
  #instance: {
    zotero: Database;
    bbtAfterMigration: boolean;
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

  status: DatabaseStatus = "NOT_INITIALIZED";

  get loadStatus(): LoadStatus {
    if (this.#instance?.zotero.opened !== true) {
      return {
        main: false,
        bbtMain: false,
        bbtSearch: null,
      };
    }
    const loadedDb = this.#instance.zotero.databaseList;
    const isMainLoaded = loadedDb.some((v) => v.name === BBT_MAIN_DB_NAME);
    if (!isMainLoaded)
      return {
        main: true,
        bbtMain: false,
        bbtSearch: null,
      };

    // In v6.7.128+, citekeys are stored in main db
    if (this.#instance.bbtAfterMigration)
      return {
        main: true,
        bbtMain: true,
        bbtSearch: null,
      };
    // Before v6.7.128, the citekeys is stored in dedicated database
    const isSearchLoaded = loadedDb.some((v) => v.name === BBT_SEARCH_DB_NAME);
    return {
      main: true,
      bbtMain: true,
      bbtSearch: isSearchLoaded,
    };
  }
  get bbtLoadStatus(): boolean {
    const status = this.loadStatus;
    if (!status.bbtMain) return false;
    // null or true
    return status.bbtSearch !== false;
  }

  getItemIDsFromCitekey(citekeys: string[]) {
    if (!this.#instance) throw new DatabaseNotSetError();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BibtexGetId = this.#instance.bbtAfterMigration
      ? BibtexGetIdV1
      : BibtexGetIdV0;
    return this.#instance.zotero.prepare(BibtexGetId).query({ citekeys });
  }
  getCitekeys(items: IDLibID[]) {
    if (!this.#instance) throw new DatabaseNotSetError();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BibtexGetCitekey = this.#instance.bbtAfterMigration
      ? BibtexGetCitekeyV1
      : BibtexGetCitekeyV0;
    return this.#instance.zotero.prepare(BibtexGetCitekey).query({ items });
  }

  load(paths: DatabasePaths, opts: DatabaseOptions): LoadStatus {
    const db = {
      zotero: this.#instance?.zotero ?? new Database(),
    };
    try {
      const zoteroLoadStatus = db.zotero.open(paths.zotero, opts);
      if (!zoteroLoadStatus) {
        throw new Error(
          `Failed to open main database, no database found at ${paths.zotero}`,
        );
      }

      const bbtLoadStatus = openBetterBibtex(paths, db.zotero);

      const libraries = db.zotero
        .prepare(AllLibraries)
        .query()
        .reduce(
          (rec, lib) => ((rec[lib.libraryID] = lib), rec),
          {} as Record<number, LibraryInfo>,
        );
      this.#instance = {
        ...db,
        bbtAfterMigration: bbtLoadStatus.bbtSearch === null,
        libraries,
      };
      this.status = "READY";
      return { main: zoteroLoadStatus, ...bbtLoadStatus };
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

function openBetterBibtex(paths: DatabasePaths, db: Database): BBTLoadStatus {
  try {
    db.attachDatabase(
      `file:${paths.bbtMain}?mode=ro&immutable=1`,
      BBT_MAIN_DB_NAME,
    );
  } catch (err) {
    const { code } = err as { code: string };
    if (code === "SQLITE_CANTOPEN") {
      log.debug(
        `Unable to open bbt main database, no database found at ${paths.bbtMain}`,
      );
    } else {
      log.debug(`Unable to open bbt main database, ${code} @ ${paths.bbtMain}`);
    }
    return { bbtMain: false, bbtSearch: null };
  }
  const isAfterMigration = isBBTAfterMigration(db);
  if (isAfterMigration) return { bbtMain: true, bbtSearch: null };
  try {
    db.attachDatabase(
      `file:${paths.bbtSearch}?mode=ro&immutable=1`,
      BBT_MAIN_DB_NAME,
    );
  } catch (err) {
    const { code } = err as { code: string };
    if (code === "SQLITE_CANTOPEN") {
      log.debug(
        `Unable to open bbt search database, no database found at ${paths.bbtSearch}`,
      );
    } else {
      log.debug(
        `Unable to open bbt search database, ${code} @ ${paths.bbtSearch}`,
      );
    }
    return { bbtMain: true, bbtSearch: false };
  }
  return { bbtMain: true, bbtSearch: true };
}
