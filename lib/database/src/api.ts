import type { LogLevel } from "@obzt/common";
import type {
  Annotation,
  ItemTag,
  LibraryInfo,
  GeneralItem,
} from "@obzt/zotero-type";
import type Fuse from "fuse.js";

import type { AttachmentInfo } from "./query/sql";
export type { AttachmentInfo } from "./query/sql";

export interface DbWorkerAPI {
  setLoglevel(level: LogLevel): void;
  /* open new database, return true if successful */
  openDb(
    nativeBinding: string,
    mainDbPath: string,
    bbtDbPath: string,
  ): [mainDbResult: boolean, bbtDbResult: boolean];
  isUpToDate(): boolean | null;
  refreshDb(): [mainDbResult: boolean, bbtDbResult: boolean];
  checkDbStatus(name: "main" | "bbt"): boolean;

  /* start index for library, need to be called before query and after openDb */
  initIndex(libraryID: number): void;

  query(
    libraryID: number,
    pattern: string | Fuse.Expression | null,
    options?: Fuse.FuseSearchOptions,
  ): Fuse.FuseResult<GeneralItem>[];
  /**
   * @param item item key or item id
   */
  getItem(item: string | number, libraryID: number): GeneralItem | null;

  getLibs(): LibraryInfo[];
  getAnnotations(attachmentId: number, libraryID: number): Annotation[];
  getAttachments(docId: number, libraryID: number): AttachmentInfo[];
  getTags(itemIds: number[], libraryID: number): Record<number, ItemTag[]>;

  raw<R>(mode: "get", sql: string, args: any[]): R;
  raw<R>(mode: "all", sql: string, args: any[]): R[];
  raw<R>(mode: "get" | "all", sql: string, args: any[]): R | R[];

  getAnnotFromKey(
    keys: string[],
    libraryID: number,
  ): Record<string, Annotation>;
}

type ToWorkpoolType<API extends DbWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type DbWorkerAPIWorkpool = ToWorkpoolType<DbWorkerAPI>;
