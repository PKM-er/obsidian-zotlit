import type { LibraryInfo } from "@obzt/zotero-type";
import { cache, databases } from "../init";
import { AllLibraries } from "../query/sql";

export const loadLibraryInfo = () =>
  (cache.libraries = databases.main
    .prepare(AllLibraries)
    .query()
    .reduce(
      (rec, lib) => ((rec[lib.libraryID] = lib), rec),
      {} as Record<number, LibraryInfo>,
    ));
