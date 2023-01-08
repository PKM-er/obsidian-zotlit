import { initLogger } from "@obzt/common";
import type { LogLevel } from "@obzt/common";
import localforage from "localforage";
import log4js, { levels } from "log4js";

export const DEFAULT_LOGLEVEL: LogLevel = "INFO";

const logger = initLogger("db-worker", DEFAULT_LOGLEVEL, log4js);

export const storageKey = "log4js_loglevel";

localforage.getItem<string>(storageKey).then((level) => {
  if (!(typeof level === "string" && level in levels)) return;
  logger.level = level;
  console.debug(`Read from localforage: loglevel ${level}`);
});

export default logger;
