import type { LogLevel } from "@obzt/common";
import type { Annotation, ItemTag, LibraryInfo } from "@obzt/zotero-type";
import type Fuse from "fuse.js";
import type { GeneralItem } from "./modules/init-index";

export interface AttachmentInfo {
  itemID: number | null;
  key: string;
  path: string | null;
  count?: string | number;
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
  ): Promise<Fuse.FuseResult<GeneralItem>[]>;

  getLibs(): Promise<LibraryInfo[]>;
  getAnnotations(
    attachmentId: number,
    libraryID: number,
  ): Promise<Annotation[]>;
  getAttachments(docId: number, libraryID: number): Promise<AttachmentInfo[]>;
  getTags(itemIds: number[], libraryID: number): Promise<ItemTag[]>;
}

type ToWorkpoolType<API extends DbWorkerAPI> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, (...args: any[]) => any>;

export type DbWorkerAPIWorkpool = ToWorkpoolType<DbWorkerAPI>;
