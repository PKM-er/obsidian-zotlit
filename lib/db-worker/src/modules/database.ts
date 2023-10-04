import { statSync } from "fs";
import type { Database as DatabaseInstance } from "@aidenlx/better-sqlite3";
import DatabaseConstructor from "@aidenlx/better-sqlite3";
import type { PreparedBase, PreparedBaseCtor } from "@obzt/database";
import log from "@log";

export class DatabaseNotSetError extends Error {
  constructor() {
    super("Database not set");
  }
}

const getMtime = (dbPath: string) => statSync(dbPath).mtimeMs;

export default class Database {
  private database: {
    instance: DatabaseInstance;
    mtime: number;
    file: string;
    prepared: Map<PreparedBaseCtor, PreparedBase<any, any, any>>;
  } | null = null;
  public get instance(): DatabaseInstance | undefined {
    return this.database?.instance;
  }
  nativeBinding: string | null = null;

  /**
   * @returns null if no database available
   */
  isUpToDate(): boolean | null {
    if (!this.database) return null;
    return this.database.mtime === getMtime(this.database.file);
  }

  // why specify type explicitly: https://github.com/microsoft/TypeScript/issues/5711
  private initDatabase(filename: string, binding: string): DatabaseInstance {
    return new DatabaseConstructor(`file:${filename}?mode=ro&immutable=1`, {
      nativeBinding: binding,
      uriPath: true,
      verbose: process.env.SQL_VERBOSE
        ? (message?: any, ...additionalArgs: any[]) =>
            log.trace(`SQL: ${message}`, ...additionalArgs)
        : undefined,
    });
  }

  opened = false;
  /**
   * set new database path and open connection
   * @param nativeBinding path to better-sqlite3.node
   * @returns false if no file found on given path
   */
  public open(params: { file?: string; nativeBinding?: string }): boolean {
    const nativeBinding = params.nativeBinding
      ? (this.nativeBinding = params.nativeBinding)
      : this.nativeBinding;
    if (!nativeBinding) {
      throw new Error(
        "Failed to open database conn: no native binding provided",
      );
    }
    let dbPath;
    if (!params.file) {
      // refresh
      if (!this.database?.file) throw new DatabaseNotSetError();
      dbPath = this.database.file;
    } else {
      dbPath = params.file;
    }
    try {
      if (this.database?.instance) {
        log.debug(
          "Database opened before, closing: ",
          this.database.instance.name,
        );
        this.close();
      }
      this.database = {
        mtime: getMtime(dbPath),
        instance: this.initDatabase(dbPath, nativeBinding),
        file: dbPath,
        prepared: new Map(),
      };
      log.debug("Database opened: ", dbPath);
      this.opened = true;
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Failed to open database", dbPath);
        throw error;
      }
      this.opened = false;
      return false;
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
