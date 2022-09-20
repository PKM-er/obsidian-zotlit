import { Database as DBType } from "@aidenlx/better-sqlite3";
import DB from "@aidenlx/better-sqlite3";
import log from "@log";
import path, { join } from "path";

// import { DatabaseNotSetError } from "./misc";
// import { createDbCopy, getLatestDbCopyPath, updateDbCopy } from "./manage-copy";
import { DatabaseNotSetError } from "./misc";

declare global {
  var __ob_cfg_dir: string;
}
const DatabaseOptions: DB.Options & {
  nativeBinding: string;
  uriPath: boolean;
} = {
  readonly: true,
  timeout: 1e3,
  uriPath: true,
  nativeBinding: join(__ob_cfg_dir, "better_sqlite3.node"),
};

export default class Database {
  // private _dbInfo: DBInfo | null = null;
  private _database: DBType | null = null;
  public get db() {
    return this._database;
  }
  #path: string | null = null;

  /**
   * set new database path and open connection
   * @param dbPath
   * @returns false if no file found on given path
   */
  public async open(path: string): Promise<boolean> {
    if (this._database?.open) {
      log.info("Database opened before, closing: ", this._database.name);
      this._database.close();
    }
    try {
      this.#path = path;
      this._database = new DB(
        `file:${path}?mode=ro&immutable=1`,
        DatabaseOptions,
      );
      log.info("Database opened: ", path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return false;
    }
  }
  public refresh() {
    if (!this.#path) throw new DatabaseNotSetError();
    return this.open(this.#path);
  }

  public close() {
    this._database?.close();
    // this._dbInfo = null;
  }
}
