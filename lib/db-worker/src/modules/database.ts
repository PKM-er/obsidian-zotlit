import { statSync } from "fs";
import type {
  Database as DatabaseInstance,
  Statement,
} from "@aidenlx/better-sqlite3";
import DatabaseConstructor from "@aidenlx/better-sqlite3";
import log from "@log";
import type { PreparedBase, PreparedBaseCtor } from "@obzt/database";
import type { DatabaseOptions } from "@obzt/database/api";

export class DatabaseNotSetError extends Error {
  constructor() {
    super("Database not set");
  }
}

const getMtime = (dbPath: string) => {
  try {
    return statSync(dbPath).mtimeMs;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return -1;
    throw err;
  }
};

interface DatabaseListItem {
  seq: number;
  name: string;
  file: string;
}

// ATTACH DATABASE 'file:/Users/aidenlx/Zotero/better-bibtex.sqlite?mode=ro&immutable=1' AS bbt;

export default class Database {
  private database: {
    instance: DatabaseInstance;
    mtime: number;
    file: string;
    prepared: Map<PreparedBaseCtor, PreparedBase<any, any, any>>;
    existStatements: Record<string, Statement>;
  } | null = null;
  public get instance(): DatabaseInstance | undefined {
    return this.database?.instance;
  }

  public get databaseList(): DatabaseListItem[] {
    return this.instance?.pragma("database_list") ?? [];
  }

  public tableExists(name: string, db = ""): boolean {
    if (!this.database) throw new DatabaseNotSetError();
    const statementAccessKey = db ? db : "main";
    const { exist } = (this.database.existStatements[statementAccessKey] ??=
      this.database.instance.prepare(
        `SELECT count(*) AS exist FROM ${
          db ? `${db}.` : ""
        }sqlite_master WHERE type = 'table' AND name = $tableName`,
      )).get({ tableName: name }) as { exist: number };
    return !!exist;
  }

  /**
   * @param path path to database file
   * @param name database name
   */
  public attachDatabase(path: string, name: string) {
    if (!this.instance) throw new DatabaseNotSetError();
    this.instance.prepare(`ATTACH DATABASE $path AS ${name}`).run({ path });
  }
  /**
   * @param name database name
   */
  public detachDatabase(name: string) {
    if (!this.instance) throw new DatabaseNotSetError();
    this.instance.prepare(`DETACH DATABASE ${name}`).run();
  }

  /**
   * @returns null if no database available
   */
  isUpToDate(): boolean | null {
    if (!this.database) return null;
    const latestMtime = getMtime(this.database.file);
    if (latestMtime === -1) return null;
    return this.database.mtime === latestMtime;
  }

  opened = false;

  /**
   * Initializes a new instance of the SQLite database.
   * @param file - The path to the database file.
   * @returns A new instance of the SQLite database.
   */
  public open(file: string, opts: DatabaseOptions): boolean {
    try {
      if (this.database?.instance) {
        log.debug(
          "Database opened before, closing: ",
          this.database.instance.name,
        );
        this.close();
      }
      const mtime = getMtime(file);
      // file not exists
      if (mtime === -1) {
        this.opened = false;
        return false;
      }
      this.database = {
        mtime,
        instance: initDatabase(file, opts),
        file,
        existStatements: {},
        prepared: new Map(),
      };
      log.debug("Database opened: ", file);
      this.opened = true;
      return true;
    } catch (error) {
      log.error("Failed to open database", file);
      throw error;
    }
  }

  public close() {
    this.opened = false;
    this.instance?.close();
    this.database = null;
  }

  prepare<P extends PreparedBase<any, any, any>>(ctor: {
    new (database: DatabaseInstance): P;
  }): P {
    if (!this.database) throw new DatabaseNotSetError();
    const existing = this.database.prepared.get(ctor);
    if (existing) return existing as P;
    const prepared = new ctor(this.database.instance);
    this.database.prepared.set(ctor, prepared);
    return prepared;
  }
}

/**
 * Initializes a new instance of the SQLite database.
 * @param path - The path to the database file.
 * @param binding - The path to the SQLite nodejs native binding binary.
 * @returns A new instance of the SQLite database.
 */
function initDatabase(path: string, opts: DatabaseOptions) {
  // immutable tag to prevent database locked error
  return new DatabaseConstructor(`file:${path}?mode=ro&immutable=1`, {
    nativeBinding: opts.nativeBinding,
    uriPath: true,
    verbose: process.env.SQL_VERBOSE
      ? (message?: any, ...additionalArgs: any[]) =>
          log.trace(`SQL: ${message}`, ...additionalArgs)
      : undefined,
  });
}
