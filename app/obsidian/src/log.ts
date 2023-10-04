import { initLogger } from "@obzt/common";
import type { LogLevel } from "@obzt/common";
import { Service, calc, effect } from "@ophidian/core";
import log4js, { levels } from "log4js";
import DatabaseWorker from "./services/zotero-db/connector/service";
import { SettingsService, skip } from "./settings/base";

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

const log = initLogger("main", getDefaultLogLevel(), log4js);

export default log;

export const logError = (message: string, error: unknown, ...args: any[]) => {
  if (!error) {
    log.error(message, ...args);
    return;
  }
  log.error(
    message,
    error instanceof Error ? error.message : String(error),
    ...args,
  );
  // show error in console with proper stack trace
  console.error(error);
};

export interface SettingsLog {
  logLevel: LogLevel;
}

export const defaultSettingsLog: SettingsLog = {
  logLevel: DEFAULT_LOGLEVEL,
};

export class LogService extends Service {
  settings = this.use(SettingsService);

  @calc
  get level() {
    return this.settings.current?.logLevel;
  }

  async applyLogLevel() {
    localStorage.setItem(storageKey, this.level);
    await this.use(DatabaseWorker).api.setLoglevel(this.level);
  }

  onload(): void {
    this.register(
      effect(
        skip(
          () => this.applyLogLevel(),
          () => this.level,
        ),
      ),
    );
  }
}
