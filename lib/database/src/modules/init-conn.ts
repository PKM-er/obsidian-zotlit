import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";
import Database from "./db/index.js";

export const openDb: DbWorkerAPI["openDb"] = async (
  pluginDir,
  mainDbPath,
  bbtDbPath,
) => {
  const mainOpened = databases.main.open(mainDbPath, pluginDir);
  let bbtOpened: Promise<boolean> | null = null;
  if (bbtDbPath) {
    databases.bbt = databases.bbt ?? new Database();
    bbtOpened = databases.bbt.open(bbtDbPath, pluginDir);
  }
  const [main, bbt] = await Promise.allSettled([mainOpened, bbtOpened]);

  return [logError("main", mainDbPath, main), logError("bbt", bbtDbPath, bbt)];
};
export const refreshDb: DbWorkerAPI["refreshDb"] = async () => {
  return await Promise.all([
    databases.main.refresh(),
    databases.bbt?.refresh() ?? false,
  ]);
};
/**
 * @returns true if opened successfully
 */
const logError = (
  name: "main" | "bbt",
  path: string | null,
  result: PromiseSettledResult<boolean | null> | undefined,
): boolean => {
  if (!result || !path) return false;
  if (result.status === "fulfilled" && result.value === true) {
    return true;
  }
  if (result.status === "rejected" || result.value === false) {
    log.error(
      `Failed to open ${name} database`,
      result.status === "rejected"
        ? result.reason
        : "no database found at " + path,
    );
  }
  return false;
};
