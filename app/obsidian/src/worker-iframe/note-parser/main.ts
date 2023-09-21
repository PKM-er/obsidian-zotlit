import Worker from "@aidenlx/workerpool/worker";
import { logError } from "@obzt/common";
import type { NoteParserWorkerAPI } from "./api";
import parse from "./parse.js";

new Worker(
  logError({
    parse,
  } satisfies NoteParserWorkerAPI),
);
