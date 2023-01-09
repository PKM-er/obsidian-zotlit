import type { LibraryInfo } from "@obzt/database";
import { AllLibraries } from "@obzt/database";
import { cache, databases } from "../init.js";

export const loadLibraryInfo = () =>
  (cache.libraries = databases.main
    .prepare(AllLibraries)
    .query()
    .reduce(
      (rec, lib) => ((rec[lib.libraryID] = lib), rec),
      {} as Record<number, LibraryInfo>,
    ));
