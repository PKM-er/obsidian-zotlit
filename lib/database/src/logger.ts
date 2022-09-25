import { constants } from "@obzt/common";
import { getLogger } from "log4js";
const logger = getLogger(constants.loggerCategory("db-worker"));

logger.level = "debug";

export default logger;
