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

export interface DatabaseOptions {
  /** The path to the SQLite nodejs native binding binary. */
  nativeBinding: string;
}

export interface DatabasePaths {
  zotero: string;
  /** better-bibtex-search.sqlite */
  bbtSearch: string;
  /** better-bibtex.sqlite */
  bbtMain: string;
}
export interface LoadStatus extends BBTLoadStatus {
  /** zotero.sqlite load status */
  main: boolean;
}
export interface BBTLoadStatus {
  /** better-bibtex.sqlite load status */
  bbtMain: boolean;
  /**
   * better-bibtex-search.sqlite load status
   * null => version after migration, no need to load
   */
  bbtSearch: boolean | null;
}

export interface DbWorkerAPI {
  setLoglevel(level: LogLevel): void;
  openDb(paths: DatabasePaths, opts: DatabaseOptions): LoadStatus;

  isUpToDate(): boolean | null;
  getLoadStatus(): { main: boolean; bbt: boolean; bbtVersion: "v0" | "v1" };

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
  ): Promise<(RegularItemInfo | null)[]>;

  getItemsFromCache(limit: number, lib: number): Promise<RegularItemInfo[]>;

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
