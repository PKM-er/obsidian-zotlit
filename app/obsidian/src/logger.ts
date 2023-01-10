import { initLogger } from "@obzt/common";
import type { LogLevel } from "@obzt/common";
import log4js, { levels } from "log4js";
import type { DbWorkerAPI } from "./zotero-db/api";
import Settings from "./zotero-db/settings-base";

const DEFAULT_LOGLEVEL: LogLevel = "INFO";
export const storageKey = "log4js_loglevel";

const getDefaultLogLevel = () => {
  const level = localStorage.getItem(storageKey);
  if (typeof level === "string" && level in levels) {
    console.debug(`Read from localstorage: loglevel ${level}`);
    return level as LogLevel;
  } else {
    return DEFAULT_LOGLEVEL;
  }
};

const logger = initLogger("main", getDefaultLogLevel(), log4js);

export default logger;

interface SettingOptions {
  level: LogLevel;
}

export class LogSettings extends Settings<SettingOptions> {
  getDefaults(): SettingOptions {
    return { level: DEFAULT_LOGLEVEL };
  }
}

export const applyLoglevel = async (api: DbWorkerAPI, level: LogLevel) => {
  logger.level = level;
  localStorage.setItem(storageKey, level);
  await api.setLoglevel(level);
};
