import type { LogLevel } from "@obzt/common";
import type {
  DocumentSearchOptions,
  SimpleDocumentSearchResultSetUnit,
} from "flexsearch";
import type { AnnotationInfo, NoteInfo, RegularItemInfo } from "./item.js";
import type { IDLibID, KeyLibID } from "./utils/database.js";
import type { LibraryInfo, AttachmentInfo, TagInfo } from "./index.js";

export type QueryOption = DocumentSearchOptions<false>;
export type { SimpleDocumentSearchResultSetUnit } from "flexsearch";

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

  search(
    libraryID: number,
    options: Partial<DocumentSearchOptions<false>>,
  ): Promise<SimpleDocumentSearchResultSetUnit[]>;
  /**
   * @param item item key or item id
   */
  getItems(
    items: IDLibID[] | KeyLibID[],
    forceUpdate?: boolean,
  ): (RegularItemInfo | null)[];

  getItemsFromCache(limit: number, lib: number): RegularItemInfo[];

  getLibs(): LibraryInfo[];
  getAnnotations(attachmentId: number, libraryID: number): AnnotationInfo[];
  getAttachments(docId: number, libraryID: number): AttachmentInfo[];
  getTags(items: IDLibID[]): Record<number, TagInfo[]>;

  raw<R>(mode: "get", sql: string, args: any[]): R;
  raw<R>(mode: "all", sql: string, args: any[]): R[];
  raw<R>(mode: "get" | "all", sql: string, args: any[]): R | R[];

  getItemIDsFromCitekey(citekeys: string[]): Record<string, number>;
  getAnnotFromKey(
    keys: string[],
    libraryID: number,
  ): Record<string, AnnotationInfo>;

  getNotes(itemID: number, libraryID: number): NoteInfo[];
  getNoteFromKey(keys: string[], libraryID: number): Record<string, NoteInfo>;
}

type ToWorkpoolType<API extends DbWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

export type DbWorkerAPIWorkpool = ToWorkpoolType<DbWorkerAPI>;
