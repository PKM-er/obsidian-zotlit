import type { IDLibID, LibraryInfo, RelationInfo } from "@obzt/database";
import {
  AllLibraries,
  BBT_MAIN_DB_NAME,
  BibtexGetCitekeyV1,
  BibtexGetIdV1,
  Relations,
  ItemsByKey,
  extractZoteroKey,
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

export default class Connections {
  #instance: {
    zotero: Database;
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
        bbtSearch: null, // Legacy field, always null in Zotero 6+
      };
    }
    const loadedDb = this.#instance.zotero.databaseList;
    const isMainLoaded = loadedDb.some((v) => v.name === BBT_MAIN_DB_NAME);
    return {
      main: true,
      bbtMain: isMainLoaded,
      bbtSearch: null, // Legacy field, always null in Zotero 6+
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
    // Only use V1 query for Zotero 6+ / BBT 6.0+
    return this.#instance.zotero.prepare(BibtexGetIdV1).query({ citekeys });
  }
  getCitekeys(items: IDLibID[]) {
    if (!this.#instance) throw new DatabaseNotSetError();
    // Only use V1 query for Zotero 6+ / BBT 6.0+
    return this.#instance.zotero.prepare(BibtexGetCitekeyV1).query({ items });
  }

  getRelations(items: IDLibID[]) {
    if (!this.#instance) throw new DatabaseNotSetError();

    // Get simplified relations first
    const rawRelations = this.#instance.zotero.prepare(Relations).query(items);

    // Process relations to extract keys and resolve related items
    const processedRelations: Record<number, RelationInfo[]> = {};

    Object.entries(rawRelations).forEach(([itemIdStr, relationList]) => {
      const itemId = parseInt(itemIdStr);
      processedRelations[itemId] = [];

      relationList.forEach(relation => {
        // Extract the Zotero key from URI or use as-is
        const extractedKey = extractZoteroKey(relation.relatedItemKey);

        // Look up the related item by key
        let relatedItem = null;
        try {
          // Try to find the related item by key in the same library first
          const currentLibrary = items.find(([itemID]) => itemID === relation.itemID)?.[1];
          if (currentLibrary && this.#instance) {
            relatedItem = this.#instance.zotero.prepare(ItemsByKey).query([[extractedKey, currentLibrary]])?.[extractedKey];
          }

          // If not found in same library, search all libraries
          if (!relatedItem && this.#instance) {
            for (const library of Object.keys(this.#instance.libraries).map(Number)) {
              relatedItem = this.#instance.zotero.prepare(ItemsByKey).query([[extractedKey, library]])?.[extractedKey];
              if (relatedItem) break;
            }
          }
        } catch (error) {
          // Item not found, continue without related item details
        }

        // Build the relation info with the expected properties
        const relationInfo: RelationInfo = {
          itemID: relation.itemID,
          relatedItemKey: relation.relatedItemKey,
          relationType: relation.relationType,
          // Add properties expected by the existing code
          relatedZoteroKey: extractedKey,
          relatedItemID: relatedItem?.itemID || null,
          relatedLibraryID: relatedItem?.libraryID || null,
        } as any;

        processedRelations[itemId].push(relationInfo);
      });
    });

    return processedRelations;
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
  // For Zotero 6+ / BBT 6.0+, we only use the main database
  return { bbtMain: true, bbtSearch: null };
}
