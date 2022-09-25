import type { DbWorkerAPI } from "@api";
import { databases } from "@init";
import log from "@log";
import Database from "./db/index.js";

const openDb: DbWorkerAPI["openDb"] = async (
  pluginDir,
  mainDbPath,
  bbtDbPath,
) => {
  const tasks: [main: Promise<boolean>, bbt?: Promise<boolean>] = [
    databases.main.open(mainDbPath, pluginDir),
  ];
  if (bbtDbPath) {
    if (!databases.bbt) databases.bbt = new Database();
    tasks[1] = databases.bbt.open(bbtDbPath, pluginDir);
  } else {
    databases.bbt = null;
  }
  const [main, bbt] = await Promise.allSettled(tasks);

  return [logError("main", mainDbPath, main), logError("bbt", bbtDbPath, bbt)];
};
export default openDb;
/**
 * @returns true if opened successfully
 */
const logError = (
  name: "main" | "bbt",
  path: string | null,
  result: PromiseSettledResult<boolean | undefined> | undefined,
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
