/* eslint-disable @typescript-eslint/no-explicit-any */
import { worker } from "@aidenlx/workerpool";
import { around } from "monkey-around";
import type { NoteParserWorkerAPI } from "./api";
import parse from "./modules/parse.js";

const methods: NoteParserWorkerAPI = {
  parse,
};

const logError = (methods: NoteParserWorkerAPI) => {
  const logger =
    (next: any) =>
    async (...args: any[]) => {
      try {
        return await next(...args);
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
  around(
    methods,
    Object.fromEntries(Object.keys(methods).map((name) => [name, logger])),
  );
  return methods as never;
};

worker(logError(methods));
