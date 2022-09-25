import { join } from "path";
import { constants } from "@obzt/common";
import type { Knex } from "@knex";
import knex, { getKnexOptions } from "@knex";
import log from "@log";

// import { DatabaseNotSetError } from "./misc.js";
// import { createDbCopy, getLatestDbCopyPath, updateDbCopy } from "./manage-copy.js";
import { DatabaseNotSetError } from "./misc.js";

// const DatabaseOptions: DB.Options = {
//   readonly: true,
//   timeout: 1e3,
//   uriPath: true,
//   nativeBinding: join(__ob_cfg_dir, libName),
// };

export default class Database {
  // private _dbInfo: DBInfo | null = null;
  private _database: Knex | null = null;
  public get db() {
    return this._database;
  }
  #path: string | null = null;
  #nativeBinding: string | null = null;

  /**
   * set new database path and open connection
   * @param dbPath
   * @returns false if no file found on given path
   */
  public async open(dbPath: string, pluginDir: string): Promise<boolean> {
    this.#nativeBinding = join(pluginDir, constants.libName);
    try {
      if (this._database) {
        log.info("Database opened before, closing: ", this._database.name);
        await this._database.destroy();
        this._database.initialize(getKnexOptions(dbPath, this.#nativeBinding));
      } else {
        this._database = knex(dbPath, this.#nativeBinding);
      }
      log.info("Database opened: ", dbPath);
      this.#path = dbPath;
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return false;
    }
  }
  public refresh() {
    if (!this.#path) throw new DatabaseNotSetError();
    if (!this.#nativeBinding) {
      throw new Error(
        "Failed to refresh database: no native binding path set before",
      );
    }
    return this.open(this.#path, this.#nativeBinding);
  }

  public async close() {
    await this._database?.destroy();
  }
}
