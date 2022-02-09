import assertNever from "assert-never";
import { constants as fsConst, promises as fs } from "fs";
import path from "path";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

import ZoteroPlugin from "./zt-main";

export default class ZoteroDb {
  constructor(private plugin: ZoteroPlugin) {}

  mode: "main" | "temp" = "main";
  private dbInstance: Database | null = null;

  get srcDbPath(): string {
    return this.plugin.settings.zoteroDbPath;
  }
  async getTempDbPath() {
    const srcDbMtime = (await fs.stat(this.srcDbPath)).mtimeMs;
    return `${this.srcDbPath}.${srcDbMtime}.temp`;
  }

  async open(mode = this.mode): Promise<this> {
    if (this.dbInstance && this.mode === mode) return this;
    else if (this.dbInstance) await this.dbInstance.close();
    let filename;
    switch (mode) {
      case "main":
        filename = this.srcDbPath;
        break;
      case "temp":
        filename = await this.getTempDbPath();
        break;
      default:
        assertNever(mode);
    }
    const db = await open({ filename, driver: sqlite3.Database });
    this.mode = mode;
    this.dbInstance = db;
    return this;
  }

  /**
   * try to keep temp databse up to date with main database
   * remove out-of-date temp database
   * @returns true if temp database was updated
   */
  async tryUpdateTempDb(): Promise<boolean> {
    const newTempDbPath = await this.getTempDbPath();
    try {
      await fs.copyFile(this.srcDbPath, newTempDbPath, fsConst.COPYFILE_EXCL);
      const dir = path.dirname(this.srcDbPath);
      for (const relatviePath of await fs.readdir(dir)) {
        const file = path.join(dir, relatviePath);
        if (
          file !== newTempDbPath &&
          file.startsWith(this.srcDbPath) &&
          file.endsWith(".temp")
        ) {
          fs.rm(file, { force: true });
        }
      }
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
      else throw error;
    }
  }

  /**
   *
   * @param readAction a function that takes a database to perform database reads
   * @returns
   */
  async read<T>(readAction: (db: Database) => Promise<T>): Promise<T> {
    const action = async () => {
        if (!this.dbInstance) throw new Error("No database currently opened");
        return await readAction(this.dbInstance);
      },
      tempDbBusy = () =>
        Promise.reject(`Temp database is busy: ${this.getTempDbPath()}`);

    return action()
      .catch(async (err) => {
        if (err.code === "SQLITE_BUSY") {
          if (this.mode === "main") {
            // create a copy of the main database and open it
            await this.tryUpdateTempDb();
            await this.open("temp");
            return action();
          } else if (this.mode === "temp") {
            return tempDbBusy();
          } else {
            assertNever(this.mode);
          }
        } else return Promise.reject(err);
      })
      .catch((err) =>
        err.code === "SQLITE_BUSY" && this.mode === "temp"
          ? tempDbBusy()
          : Promise.reject(err),
      );
  }

  /** check if zotero is running and its database is busy
   * and update mode accordingly */
  async refresh() {
    (await this.open("main")).read((db) =>
      db.run("SELECT groupID FROM groups"),
    );
  }
}
