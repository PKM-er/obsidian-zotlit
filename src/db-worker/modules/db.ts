import log from "@log";
import assertNever from "assert-never";
import type { Database as DBType, SqliteError } from "better-sqlite3";
import db from "better-sqlite3";
import { constants as fsConst, promises as fs } from "fs";
import path from "path";

const enum DbMode {
  /** reading from database directly */
  source,
  /** reading from a copy of the source database */
  copy,
}

export default class Database {
  constructor(private dbPath: string) {}

  /**
   * source: reading directly from database;
   * copy: reading from a copy of the source database to prevent locking issue
   */
  mode: DbMode = DbMode.source;
  private dbInstance: DBType | null = null;
  version: number = -1;

  async getDbCopyPath() {
    const mtime = (await fs.stat(this.dbPath)).mtimeMs;
    return {
      path: `${this.dbPath}.${mtime}.temp`,
      time: mtime,
    };
  }

  async open(mode = this.mode): Promise<this> {
    if (this.dbInstance && this.mode === mode && this.dbInstance.open) {
      return this;
    } else if (this.dbInstance?.open) this.dbInstance.close();
    let { path, time } = await this.getDbCopyPath();
    if (mode === DbMode.source) {
      path = this.dbPath;
    }
    this.mode = mode;
    this.dbInstance = new db(path, {
      readonly: true,
      timeout: 1e3,
    });
    this.version = time;
    return this;
  }

  /**
   * try to keep databse copy up to date with main database
   * create new copy and remove out-of-date copies
   * @returns true if temp database was updated
   */
  async tryUpdateDbCopy(): Promise<boolean> {
    const { path: newCopy } = await this.getDbCopyPath();
    try {
      await fs.copyFile(this.dbPath, newCopy, fsConst.COPYFILE_EXCL);
      const dir = path.dirname(this.dbPath);
      for (const relatviePath of await fs.readdir(dir)) {
        const file = path.join(dir, relatviePath);
        if (
          file !== newCopy &&
          file.startsWith(this.dbPath) &&
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
          throw new Error("No database currently opened: " + this.dbPath);
        return readAction(this.dbInstance);
      },
      tempDbBusy = `Temp database is busy: ${this.getDbCopyPath()}`;

    let count = 0;

    do {
      try {
        return action();
      } catch (err) {
        if (!((err as InstanceType<SqliteError>).code === "SQLITE_BUSY")) {
          throw err;
        }
        if (this.mode === DbMode.source) {
          log.info(
            `Seems like ${this.dbPath} database is occupied, trying to switch to temp database...`,
          );
          // create a copy of the main database and open it
          await this.tryUpdateDbCopy();
          await this.open(DbMode.copy);
        } else if (this.mode === DbMode.copy) {
          throw new Error(tempDbBusy);
        } else {
          assertNever(this.mode);
        }
      }
      count++;
    } while (count <= 1);
    throw new Error(
      "Failed to switch to temp database when main database was occupied: " +
        this.dbPath,
    );
  }

  /** check if zotero is running and its database is busy
   * and update mode accordingly */
  async refresh() {
    (await this.open(DbMode.source)).read((db) =>
      db.prepare("SELECT groupID FROM groups"),
    );
  }

  close() {
    this.dbInstance?.close();
    this.dbInstance = null;
    this.version = -1;
  }
}
