/* eslint-disable @typescript-eslint/no-explicit-any */
import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { AnnotBlockWorkerAPI } from "./api";
import parse from "./modules/parse.js";
import stringify from "./modules/stringify.js";

const methods: AnnotBlockWorkerAPI = {
  parse,
  stringify,
};

worker(logError(methods));
