import { around } from "monkey-around";
import type { Request } from "../../common/interface.js";
import WorkerHandler from "../handler.js";

export default abstract class WebWorkerHandler extends WorkerHandler {
  abstract initWebWorker(): Worker;

  setupWorker() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const worker = Object.assign(this.initWebWorker(), {
      readyPromise: new Promise<true>((resolve) =>
        self.internal.once("ready", () => resolve(true)),
      ),
      killed: false,
      send(data: Request, opts?: StructuredSerializeOptions) {
        worker.postMessage(data, opts);
      },
      onMessage(callback: (evt: MessageEvent) => any) {
        worker.addEventListener("message", callback);
        return () => worker.removeEventListener("message", callback);
      },
      onError(callback: (evt: ErrorEvent) => any) {
        worker.addEventListener("error", callback);
        return () => worker.removeEventListener("error", callback);
      },
    });
    around(worker, {
      terminate: (next) =>
        function (this: Worker) {
          if (!worker.killed) {
            next.call(this);
            worker.killed = true;
            self.internal.emit("terminate");
          }
          self.terminateState = "finished";
        },
    });
    return worker;
  }
}
