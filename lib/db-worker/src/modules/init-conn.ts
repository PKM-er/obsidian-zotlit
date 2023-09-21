import type { DbWorkerAPI } from "@obzt/database/api";
import { databases } from "@init";
import log from "@log";
import { loadLibraryInfo } from "./load-lib.js";

export const openDb: DbWorkerAPI["openDb"] = (params) => {
  const { nativeBinding, mainDbPath, bbtDbPath } = params ?? {};
  log.debug("open database", params);
  const mainOpened = databases.main.open({ nativeBinding, file: mainDbPath });
  if (!mainOpened) {
    log.error(
      `Failed to open main database, no database found at ${mainDbPath}`,
    );
  }
  const bbtOpened = databases.bbt.open({ file: bbtDbPath, nativeBinding });
  if (!bbtOpened) {
    log.debug(`Unable to open bbt database, no database found at ${bbtDbPath}`);
  }
  loadLibraryInfo();
  return [mainOpened, bbtOpened];
};
