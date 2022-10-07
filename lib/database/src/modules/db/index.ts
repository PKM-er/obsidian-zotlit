import { promises as fs } from "fs";
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

const getMtime = async (dbPath: string) => (await fs.stat(dbPath)).mtimeMs;

export default class Database {
  // private _dbInfo: DBInfo | null = null;
  #database: { db: Knex; mtime: number; path: string } | null = null;
  public get db() {
    return this.#database?.db;
  }
  #nativeBinding: string | null = null;

  /**
   * @returns null if no database available
   */
  async isUpToDate(): Promise<boolean | null> {
    if (!this.#database) return null;
    return this.#database.mtime === (await getMtime(this.#database.path));
  }

  opened = false;
  /**
   * set new database path and open connection
   * @param dbPath
   * @returns false if no file found on given path
   */
  public async open(dbPath: string, pluginDir: string): Promise<boolean> {
    this.#nativeBinding = join(pluginDir, constants.libName);
    try {
      if (this.#database?.db) {
        log.info("Database opened before, closing: ", this.#database.db.name);
        this.opened = false;
        await this.#database.db.destroy();
        const mtime = await getMtime(dbPath);
        this.#database.db.initialize(
          getKnexOptions(dbPath, this.#nativeBinding),
        );
        this.#database.mtime = mtime;
        this.#database.path = dbPath;
      } else {
        this.#database = {
          db: knex(dbPath, this.#nativeBinding),
          mtime: await getMtime(dbPath),
          path: dbPath,
        };
      }
      log.info("Database opened: ", dbPath);
      this.opened = true;
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.opened = false;
      return false;
    }
  }
  public refresh() {
    if (!this.#database?.path) throw new DatabaseNotSetError();
    if (!this.#nativeBinding) {
      throw new Error(
        "Failed to refresh database: no native binding path set before",
      );
    }
    return this.open(this.#database.path, this.#nativeBinding);
  }

  public async close() {
    this.opened = false;
    await this.#database?.db.destroy();
    this.#database = null;
  }
}
