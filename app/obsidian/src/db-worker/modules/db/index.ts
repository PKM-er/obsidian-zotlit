import log from "@log";
import { join } from "path";

import { libName } from "../../../const.mjs";
import knex, { getKnexOptions, Knex } from "./knex.config.js";
// import { DatabaseNotSetError } from "./misc";
// import { createDbCopy, getLatestDbCopyPath, updateDbCopy } from "./manage-copy";
import { DatabaseNotSetError } from "./misc";

declare global {
  var __ob_cfg_dir: string;
}
// const DatabaseOptions: DB.Options = {
//   readonly: true,
//   timeout: 1e3,
//   uriPath: true,
//   nativeBinding: join(__ob_cfg_dir, libName),
// };

const nativeBinding = join(__ob_cfg_dir, libName);

export default class Database {
  // private _dbInfo: DBInfo | null = null;
  private _database: Knex | null = null;
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
    try {
      if (this._database) {
        log.info("Database opened before, closing: ", this._database.name);
        await this._database.destroy();
        this._database.initialize(getKnexOptions(path, nativeBinding));
      } else {
        this._database = knex(path, nativeBinding);
      }
      log.info("Database opened: ", path);
      this.#path = path;
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

  public async close() {
    await this._database?.destroy();
  }
}
