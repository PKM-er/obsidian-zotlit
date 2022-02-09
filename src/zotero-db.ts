import assertNever from "assert-never";
import type { Database as DBType, SqliteError } from "better-sqlite3";
import Database from "better-sqlite3";
import { constants as fsConst, promises as fs } from "fs";
import { Notice } from "obsidian";
import path from "path";

import ZoteroPlugin from "./zt-main";

export default class ZoteroDb {
  constructor(private plugin: ZoteroPlugin) {}

  mode: "main" | "temp" = "main";
  private dbInstance: DBType | null = null;

  get srcDbPath(): string {
    return this.plugin.settings.zoteroDbPath;
  }
  async getTempDbPath() {
    const srcDbMtime = (await fs.stat(this.srcDbPath)).mtimeMs;
    return `${this.srcDbPath}.${srcDbMtime}.temp`;
  }

  async open(mode = this.mode): Promise<this> {
    if (this.dbInstance && this.mode === mode) return this;
    else if (this.dbInstance) this.dbInstance.close();
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
    const db = new Database(filename, {
      readonly: true,
      timeout: 1e3,
    });
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
  async read<T>(readAction: (db: DBType) => T): Promise<T> {
    const action = () => {
        if (!this.dbInstance || !this.dbInstance.open)
          throw new Error("No database currently opened");
        return readAction(this.dbInstance);
      },
      tempDbBusy = `Temp database is busy: ${this.getTempDbPath()}`;

    let count = 0;

    do {
      try {
        return action();
      } catch (err) {
        if (!((err as InstanceType<SqliteError>).code === "SQLITE_BUSY")) {
          throw err;
        }
        if (this.mode === "main") {
          new Notice(
            "Seems like Zotero database is occuiped by Zotero, trying to switch to temp database...",
          );
          // create a copy of the main database and open it
          await this.tryUpdateTempDb();
          await this.open("temp");
        } else if (this.mode === "temp") {
          throw new Error(tempDbBusy);
        } else {
          assertNever(this.mode);
        }
      }
      count++;
    } while (count <= 1);
    throw new Error(
      "Failed to switch to temp database when main database was occuiped",
    );
  }

  /** check if zotero is running and its database is busy
   * and update mode accordingly */
  async refresh() {
    (await this.open("main")).read((db) =>
      db.prepare("SELECT groupID FROM groups"),
    );
  }
}
