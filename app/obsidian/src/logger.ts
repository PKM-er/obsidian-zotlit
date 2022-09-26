import { initLogger } from "@obzt/common";
import type { LogLevel } from "@obzt/common";
import log4js from "log4js";

export const DEFAULT_LOGLEVEL: LogLevel = "INFO";

export default initLogger("main", DEFAULT_LOGLEVEL, log4js);
