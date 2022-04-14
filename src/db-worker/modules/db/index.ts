import log from "@log";
import { Database as DBType } from "better-sqlite3";
import DB from "better-sqlite3";
import path from "path";

import { createDbCopy, getLatestDbCopyPath, updateDbCopy } from "./manage-copy";
import { DatabaseNotSetError, DBInfo } from "./misc";

export default class Database {
  private _dbInfo: DBInfo | null = null;
  private _database: DBType | null = null;
  public get db() {
    return this._database;
  }

  /**
   * set new database path and open connection
   * @param dbPath
   * @returns false if no file found on given path
   */
  public async openDatabase(dbPath: string): Promise<boolean> {
    try {
      const [copyPath, version] = await getLatestDbCopyPath(dbPath);
      this._dbInfo = { path: dbPath, version, copyPath };
      await createDbCopy(dbPath, copyPath);
      return this._open();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return false;
    }
  }
  public async refreshDatabase() {
    const info = this._dbInfo;
    if (!info) throw new DatabaseNotSetError();
    const result = await updateDbCopy(info);
    if (!result) {
      log.info("no update for database: ", info.version);
      if (!this._database?.open) await this._open();
    } else {
      log.info("Database version changed, refreshing");
      const [newCopyPath, newVersion] = result;
      info.version = newVersion;
      info.copyPath = newCopyPath;
      await this._open();
    }
  }

  public close() {
    this._database?.close();
    this._dbInfo = null;
  }

  /**
   * open database, close previous database if opened
   * @returns false if database not set
   */
  private async _open(): Promise<boolean> {
    const info = this._dbInfo;
    if (!info) throw new DatabaseNotSetError();
    if (this._database?.open) {
      log.info("Database opened before, closing: ", this._database.name);
      this._database.close();
    }
    try {
      this._database = new DB(info.copyPath, {
        readonly: true,
        timeout: 1e3,
      });
      log.info("Database opened: ", path);
      return true;
    } catch (error) {
      log.error("Failed to open database", error);
      return false;
    }
  }
}
