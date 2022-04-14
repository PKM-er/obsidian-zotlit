// const enum DbMode {
//   /** reading from database directly */
//   source,
//   /** reading from a copy of the source database */
//   copy,
// }
export class DatabaseNotSetError extends Error {
  constructor() {
    super("Database not set");
  }
}

export interface DBInfo {
  path: string;
  /** mtime of the database by the time of load */
  version: number;
  copyPath: string;
}
