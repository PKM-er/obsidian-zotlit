import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { AnnotBlockWorkerAPI } from "./api";
import parse from "./parse.js";
import stringify from "./stringify.js";

const methods: AnnotBlockWorkerAPI = {
  parse,
  stringify,
};

worker(logError(methods));
