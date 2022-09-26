import type log4js from "log4js";
import { loggerCategory } from "./const.js";

export const initLogger = (
  category: string,
  defaultLevel: LogLevel,
  { getLogger, configure }: typeof log4js,
) => {
  const categoryName = loggerCategory(category);
  configure({
    appenders: {
      out: { type: "console" },
    },
    categories: {
      default: { appenders: ["out"], level: defaultLevel },
      [categoryName]: { appenders: ["out"], level: defaultLevel },
    },
  });
  return getLogger(categoryName);
};

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
