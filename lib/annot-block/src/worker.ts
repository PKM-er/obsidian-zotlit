/* eslint-disable @typescript-eslint/no-explicit-any */
import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { AnnotBlockWorkerAPI } from "./api";
import parse from "./modules/parse.js";

const methods: AnnotBlockWorkerAPI = {
  parse,
};

worker(logError(methods));
