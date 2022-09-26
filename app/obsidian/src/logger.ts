import { constants } from "@obzt/common";
import { getLogger, configure } from "log4js";

const category = constants.loggerCategory("main");
export const DEFAULT_LOGLEVEL: LogLevel = "INFO";

configure({
  appenders: {
    out: { type: "console" },
  },
  categories: {
    default: { appenders: ["out"], level: DEFAULT_LOGLEVEL },
    [category]: { appenders: ["out"], level: DEFAULT_LOGLEVEL },
  },
});

const logger = getLogger();

// set level when loadSettings is called
// logger.level = DEFAULT_LOGLEVEL;

export default logger;

export type LogLevel =
  | "ALL"
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL"
  | "MARK"
  | "OFF";
export const logLevels: Record<LogLevel, LogLevel> = {
  ALL: "ALL",
  TRACE: "TRACE",
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL",
  MARK: "MARK",
  OFF: "OFF",
};
