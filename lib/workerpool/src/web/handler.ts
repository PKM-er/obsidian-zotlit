import {
  DataResponse,
  EVAL_REQ_NAME,
  METHOD_REQ_NAME,
  ReadySingal,
} from "../common/interface.js";
import type { BultiInMethod } from "../common/interface.js";
import { createNanoEvents } from "../common/utils/nanoevent.js";
import type { InvokeOptions, TaskWithId, WorkerCompat } from "./interface.js";

/**
 * Converts a serialized error to Error
 * @param {Object} obj Error that has been serialized and parsed to object
 * @return {Error} The equivalent Error.
 */
function objectToError(obj: any) {
  return Object.assign(new Error(), obj);
}

export default abstract class WorkerHandler {
  abstract setupWorker(): WorkerCompat;

  pending = new Map<number, AbortController>();
  terminateState: false | "requested" | "finished" = false;
  terminationHandler = null;
  lastId = 0;

  worker: WorkerCompat;
  constructor() {
    this.worker = this.setupWorker();
    this.worker.addEventListener("message", (evt) => this.onMessage(evt.data));
    this.worker.addEventListener("error", (evt) => this.onError(evt.error));
  }

  protected internal = createNanoEvents<{ terminate(): void; ready(): void }>();
  evt = createNanoEvents<Record<string, (payload: any) => void>>();
  private task =
    createNanoEvents<Record<number, (payload: any, error: any) => void>>();
  private onMessage(data: unknown) {
    if (this.terminateState === "finished") {
      // ignore messages after termination request
      return;
    }
    if (ReadySingal.allows(data)) {
      this.internal.emit("ready");
      return;
    }
    const { data: response, problems } = DataResponse(data);
    if (problems) {
      throw new Error(problems.toString());
    }

    if (response.eventName) {
      this.evt.emit(response.eventName, response.payload);
      return;
    }

    this.task.emit(response.id, response.payload, response.error);
    if (this.terminateState === "requested") {
      this.terminate();
    }
  }

  /** handle uncaught error */
  private onError(error: any) {
    for (const ctrl of this.pending.values()) {
      ctrl.abort(error);
    }
    this.pending.clear();
    this.worker.terminate();
  }

  methods() {
    return this.invoke<ReturnType<BultiInMethod[typeof METHOD_REQ_NAME]>>(
      METHOD_REQ_NAME,
    );
  }
  eval(body: string, args: any[], transfer?: Transferable[]) {
    const invokeArgs: Parameters<BultiInMethod[typeof EVAL_REQ_NAME]> = [
      body,
      ...args,
    ];
    return this.invoke<ReturnType<BultiInMethod[typeof EVAL_REQ_NAME]>>(
      EVAL_REQ_NAME,
      invokeArgs,
      { transfer },
    );
  }

  private send(
    { id, method, params, transfer, timeout }: TaskWithId,
    controller = new AbortController(),
  ) {
    const signal = controller.signal;
    this.pending.set(id, controller);
    return new Promise<any>((resolve, reject) => {
      this.worker.send({ id, method, params }, { transfer });
      let timeoutId = -1;
      const abortHandler = () => {
        reject(signal?.reason);
        unbind();
        window.clearTimeout(timeoutId);
      };
      if (timeout !== undefined) {
        timeoutId = window.setTimeout(() => {
          controller.abort(
            new DOMException(`Timeout after ${timeout}ms`, "TimeoutError"),
          );
        }, timeout);
      }
      signal?.addEventListener("abort", abortHandler);
      const unbind = this.task.once(id, (payload, error) => {
        signal?.removeEventListener("abort", abortHandler);
        if (error) {
          reject(objectToError(error));
        } else {
          resolve(payload);
        }
      });
    })
      .catch((err) => {
        if (
          err instanceof DOMException &&
          ["AbortError", "TimeoutError"].includes(err.name)
        ) {
          return this.terminate(true).then(() => {
            throw err;
          });
        }
        throw err;
      })
      .finally(() => {
        this.pending.delete(id);
      });
  }

  async invoke<Returns = any>(
    method: string,
    params: any[] = [],
    { controller, transfer }: Partial<InvokeOptions> = {},
  ): Promise<Returns> {
    if (this.terminateState !== false) {
      throw new Error("Worker is terminated");
    }

    const id = ++this.lastId;
    await this.worker.readyPromise;
    const response = await this.send(
      { id, method, params, transfer },
      controller,
    );
    return response;
  }

  busy() {
    return this.pending.size > 0;
  }

  /**
   * Terminate the worker.
   * @param force if false (default), the worker is terminated after finishing all tasks currently in progress. If true, the worker will be terminated immediately.
   * @param timeout If provided and non-zero, worker termination promise will be rejected after timeout if worker process has not been terminated.

  */
  terminate(force = false, timeout?: number): Promise<void> {
    if (force) {
      // cancel all tasks in progress
      for (const ctrl of this.pending.values()) {
        ctrl.abort(new Error("Worker terminated"));
      }
      this.pending.clear();
    }

    if (this.busy()) {
      // we can't terminate immediately, there are still tasks being executed
      this.terminateState = "requested";
      const terminateTask = new Promise<void>((resolve) => {
        this.internal.once("terminate", resolve);
      });
      if (timeout !== undefined) {
        return Promise.race([terminateTask, rejectOnTimeout(timeout)]).then();
      }
      return terminateTask;
    }

    // all tasks are finished. kill the worker
    this.worker.terminate();
    return Promise.resolve();
  }
}

function rejectOnTimeout(timeout: number) {
  return new Promise((reject) =>
    setTimeout(
      () =>
        reject(new DOMException(`Timeout after ${timeout}ms`, "TimeoutError")),
      timeout,
    ),
  );
}
