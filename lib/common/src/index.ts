export * as constants from "./const.js";
export * from "./block-id.js";
export * from "./zotero-date.js";
export * from "./logger.js";
export * from "./must-include.js";
export * from "./worker.js";
export * from "./qs.js";

/**
 * @returns native binding basename for given version of better-sqlite3
 */
export const betterSqlite3 = (version: string) =>
  `better-sqlite3-${version}.node`;
