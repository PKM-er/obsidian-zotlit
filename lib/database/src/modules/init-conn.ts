import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";
import { loadLibraryInfo } from "./load-lib";

export const openDb: DbWorkerAPI["openDb"] = (
  nativeBinding,
  mainDbPath,
  bbtDbPath,
) => {
  log.debug("open database", nativeBinding, mainDbPath, bbtDbPath);
  const mainOpened = databases.main.open(mainDbPath, nativeBinding);
  if (!mainOpened) {
    log.error(
      `Failed to open main database, no database found at ${mainDbPath}`,
    );
  }
  const bbtOpened = databases.bbt.open(bbtDbPath, nativeBinding);
  if (!bbtOpened) {
    log.debug(
      `Unable to open bbt database, no database found at ${mainDbPath}`,
    );
  }
  loadLibraryInfo();
  return [mainOpened, bbtOpened];
};
export const refreshDb: DbWorkerAPI["refreshDb"] = () => {
  log.debug("refresh database");
  return [databases.main.refresh(), databases.bbt.refresh() ?? false];
};
