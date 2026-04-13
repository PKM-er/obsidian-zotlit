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
import Database, { DatabaseNotSetError, toSqliteUri } from "./database";

function isBBTAfterMigration(db: Database) {
  return db.tableExists("citationkey", BBT_MAIN_DB_NAME);
}

function hasNativeCitationKeyField(db: Database) {
  const instance = db.instance;
  if (
    !instance ||
    !db.tableExists("fieldsCombined") ||
    !db.tableExists("itemData") ||
    !db.tableExists("itemDataValues")
  ) {
    return false;
  }
  const result = instance
    .prepare(
      `SELECT 1 AS exist FROM fieldsCombined WHERE fieldName = 'citationKey' LIMIT 1`,
    )
    .get() as { exist?: number } | undefined;
  return !!result?.exist;
}

export default class Connections {
  #instance: {
    zotero: Database;
    citekeyBackend: "unavailable" | "v0" | "v1";
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
    if (this.#instance.citekeyBackend === "unavailable") {
      return {
        main: true,
        bbtMain: false,
        bbtSearch: null,
      };
    }

    // In v6.7.128+, citekeys are stored in main db or can be read from
    // Zotero's native citationKey field without the legacy search database.
    if (this.#instance.citekeyBackend === "v1")
      return {
        main: true,
        bbtMain: true,
        bbtSearch: null,
      };

    // Before v6.7.128, the citekeys are stored in a dedicated search database.
    return {
      main: true,
      bbtMain: true,
      bbtSearch: true,
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
    const BibtexGetId =
      this.#instance.citekeyBackend === "v0" ? BibtexGetIdV0 : BibtexGetIdV1;
    return this.#instance.zotero.prepare(BibtexGetId).query({ citekeys });
  }
  getCitekeys(items: IDLibID[]) {
    if (!this.#instance) throw new DatabaseNotSetError();
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BibtexGetCitekey =
      this.#instance.citekeyBackend === "v0"
        ? BibtexGetCitekeyV0
        : BibtexGetCitekeyV1;
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
        citekeyBackend:
          bbtLoadStatus.bbtMain === false
            ? "unavailable"
            : bbtLoadStatus.bbtSearch === true
              ? "v0"
              : "v1",
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
  const bbtMainUri = toSqliteUri(paths.bbtMain);
  const useNativeCitationKey = () => {
    if (!hasNativeCitationKeyField(db)) return null;
    log.debug("Using native Zotero citationKey field");
    return { bbtMain: true, bbtSearch: null } satisfies BBTLoadStatus;
  };
  try {
    log.debug(`Attaching bbt main database: ${bbtMainUri}`);
    db.attachDatabase(bbtMainUri, BBT_MAIN_DB_NAME);
    log.debug(`Attached bbt main database: ${bbtMainUri}`);
  } catch (err) {
    const { code } = err as { code: string };
    if (code === "SQLITE_CANTOPEN") {
      log.debug(
        `Unable to open bbt main database, no database found at ${bbtMainUri}`,
      );
    } else {
      log.debug(`Unable to open bbt main database, ${code} @ ${bbtMainUri}`);
    }
    const nativeFallback = useNativeCitationKey();
    if (nativeFallback) return nativeFallback;
    return { bbtMain: false, bbtSearch: null };
  }
  const isAfterMigration = isBBTAfterMigration(db);
  if (isAfterMigration) return { bbtMain: true, bbtSearch: null };
  const bbtSearchUri = toSqliteUri(paths.bbtSearch);
  try {
    log.debug(`Attaching bbt search database: ${bbtSearchUri}`);
    db.attachDatabase(bbtSearchUri, BBT_SEARCH_DB_NAME);
    log.debug(`Attached bbt search database: ${bbtSearchUri}`);
  } catch (err) {
    const { code } = err as { code: string };
    if (code === "SQLITE_CANTOPEN") {
      log.debug(
        `Unable to open bbt search database, no database found at ${bbtSearchUri}`,
      );
    } else {
      log.debug(
        `Unable to open bbt search database, ${code} @ ${bbtSearchUri}`,
      );
    }
    const nativeFallback = useNativeCitationKey();
    if (nativeFallback) return nativeFallback;
    return { bbtMain: true, bbtSearch: false };
  }
  return { bbtMain: true, bbtSearch: true };
}
