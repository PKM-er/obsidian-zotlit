import WorkerMain from "@aidenlx/workerpool/worker";
import { logError } from "@obzt/common";
import type { AnnotBlockWorkerAPI } from "./api";
import parse from "./parse.js";
import stringify from "./stringify.js";

new WorkerMain(
  logError({
    parse,
    stringify,
  } satisfies AnnotBlockWorkerAPI),
);
