import { fromScriptText } from "@aidenlx/esbuild-plugin-inline-worker/utils";
import { WebWorkerHandler, WorkerPool } from "@aidenlx/workerpool";
import dbWorker from "worker:@obzt/db-worker";
import type { DbWorkerAPI } from "../api";

class DatabaseWorker extends WebWorkerHandler {
  initWebWorker(): Worker {
    return fromScriptText(dbWorker, {
      name: "zotlit database worker",
    });
  }
}
export class DatabaseWorkerPool extends WorkerPool<DbWorkerAPI> {
  workerCtor() {
    return new DatabaseWorker();
  }
}
