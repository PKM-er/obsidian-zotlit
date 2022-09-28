import type { LogLevel } from "@obzt/common";
import type { AnnotationType, RegularItem } from "@obzt/zotero-type";
import type Fuse from "fuse.js";

export interface Annotation {
  itemID: number;
  key: string;
  libraryID: number;
  groupID: number | null;
  type: AnnotationType;
  authorName: string | null;
  text: string | null;
  comment: string | null;
  color: string;
  pageLabel: string;
  sortIndex: string;
  position: string;
}

export interface AttachmentInfo {
  itemID: number;
  key: string;
  path: string;
  count?: string | number;
}

export interface LibraryInfo {
  libraryID: number;
  type: string;
  groupID: number | null;
}

export interface DbWorkerAPI {
  setLoglevel(level: LogLevel): void;
  /* open new database, return true if successful */
  openDb(
    pluginDir: string,
    mainDbPath: string,
    bbtDbPath: string | null,
  ): Promise<[mainDbResult: boolean, bbtDbResult: boolean]>;

  /* start index for library, need to be called before query and after openDb */
  initIndex(libraryID: number, refresh?: boolean): Promise<void>;

  query(
    libraryID: number,
    pattern: string | Fuse.Expression | null,
    options?: Fuse.FuseSearchOptions,
  ): Promise<Fuse.FuseResult<RegularItem>[]>;

  getLibs(): Promise<LibraryInfo[]>;
  getAnnotations(
    attachmentId: number,
    libraryID: number,
  ): Promise<Annotation[]>;
  getAttachments(docId: number, libraryID: number): Promise<AttachmentInfo[]>;
}

type ToWorkpoolType<API extends DbWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, (...args: any[]) => any>;

export type DbWorkerAPIWorkpool = ToWorkpoolType<DbWorkerAPI>;
