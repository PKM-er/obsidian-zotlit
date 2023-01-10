import type { LogLevel } from "@obzt/common";
import type Fuse from "fuse.js";
import type { AnnotationInfo, RegularItemInfo } from "./item.js";
import type { LibraryInfo, AttachmentInfo, TagInfo } from "./index.js";

export interface DbConnParams {
  nativeBinding: string;
  mainDbPath: string;
  bbtDbPath: string;
}

export interface DbWorkerAPI {
  setLoglevel(level: LogLevel): void;
  /**
   * open new database connection or refresh existing if no param passed in
   * @returns return true if successful
   */
  openDb(
    params?: Partial<DbConnParams>,
  ): [mainDbResult: boolean, bbtDbResult: boolean];

  isUpToDate(): boolean | null;
  checkDbStatus(name: "main" | "bbt"): boolean;

  /* start index for library, need to be called before query and after openDb */
  initIndex(libraryID: number): void;

  query(
    libraryID: number,
    pattern: string | Fuse.default.Expression | null,
    options?: Fuse.default.FuseSearchOptions,
  ): Fuse.default.FuseResult<RegularItemInfo>[];
  /**
   * @param item item key or item id
   */
  getItem(item: string | number, libraryID: number): RegularItemInfo | null;

  getLibs(): LibraryInfo[];
  getAnnotations(attachmentId: number, libraryID: number): AnnotationInfo[];
  getAttachments(docId: number, libraryID: number): AttachmentInfo[];
  getTags(itemIds: number[], libraryID: number): Record<number, TagInfo[]>;

  raw<R>(mode: "get", sql: string, args: any[]): R;
  raw<R>(mode: "all", sql: string, args: any[]): R[];
  raw<R>(mode: "get" | "all", sql: string, args: any[]): R | R[];

  getAnnotFromKey(
    keys: string[],
    libraryID: number,
  ): Record<string, AnnotationInfo>;
}

type ToWorkpoolType<API extends DbWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type DbWorkerAPIWorkpool = ToWorkpoolType<DbWorkerAPI>;
