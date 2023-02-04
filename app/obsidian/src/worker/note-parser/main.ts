import { worker } from "@aidenlx/workerpool";
import { logError } from "@obzt/common";
import type { NoteParserWorkerAPI } from "./api";
import parse from "./parse.js";

const methods: NoteParserWorkerAPI = {
  parse,
};

worker(logError(methods));
