import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";

export const openDb: DbWorkerAPI["openDb"] = async (
  nativeBinding,
  mainDbPath,
  bbtDbPath,
) => {
  log.debug("open database", nativeBinding, mainDbPath, bbtDbPath);
  const mainOpened = databases.main.open(mainDbPath, nativeBinding);
  let bbtOpened: Promise<boolean> | null = null;
  bbtOpened = databases.bbt.open(bbtDbPath, nativeBinding);
  const [main, bbt] = await Promise.all([mainOpened, bbtOpened]);

  if (!main) {
    log.error(
      `Failed to open main database, no database found at ${mainDbPath}`,
    );
  }
  if (!bbt) {
    log.info(`Unable to open bbt database, no database found at ${mainDbPath}`);
  }
  return [main, bbt];
};
export const refreshDb: DbWorkerAPI["refreshDb"] = async () => {
  log.debug("refresh database");
  return await Promise.all([
    databases.main.refresh(),
    databases.bbt.refresh() ?? false,
  ]);
};
