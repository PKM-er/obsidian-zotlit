import { around } from "monkey-around";
import type { Request } from "../../common/interface.js";
import WorkerHandler from "../handler.js";

export default abstract class WebWorkerHandler extends WorkerHandler {
  abstract initWebWorker(): Worker;

  setupWorker() {
    const worker = Object.assign(this.initWebWorker(), {
      readyPromise: new Promise<true>((resolve) =>
        self.internal.once("ready", () => resolve(true)),
      ),
      killed: false,
      send(data: Request, opts?: StructuredSerializeOptions) {
        postMessage(data, opts);
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
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
