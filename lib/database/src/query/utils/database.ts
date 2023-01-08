import { statSync } from "fs";
import type { Database as DatabaseInstance } from "@aidenlx/better-sqlite3";
import DatabaseConstructor from "@aidenlx/better-sqlite3";
import log from "@log";

import { DatabaseNotSetError } from "./misc.js";
import type { PreparedBase, PreparedBaseCtor } from "./prepared";

const getMtime = (dbPath: string) => statSync(dbPath).mtimeMs;

const isDev = process.env.NODE_ENV === "development";

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
      verbose: isDev ? console.log : undefined,
    });
  }

  opened = false;
  /**
   * set new database path and open connection
   * @param nativeBinding path to better-sqlite3.node
   * @returns false if no file found on given path
   */
  public open(dbPath: string, nativeBinding: string): boolean {
    this.nativeBinding = nativeBinding;
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
  public refresh() {
    if (!this.database?.file) throw new DatabaseNotSetError();
    if (!this.nativeBinding) {
      throw new Error(
        "Failed to refresh database: no native binding path set before",
      );
    }
    return this.open(this.database.file, this.nativeBinding);
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
