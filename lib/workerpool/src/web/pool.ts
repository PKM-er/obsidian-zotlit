/* eslint-disable @typescript-eslint/naming-convention */
import { type } from "arktype";
import { METHOD_REQ_NAME, EVAL_REQ_NAME } from "../common/interface.js";
import { createNanoEvents } from "../common/utils/nanoevent.js";
import type WorkerHandler from "./handler.js";
import type { ProxyMethods, InvokeOptions, Task } from "./interface.js";

/**
 * Configuration options for the Pool class
 */
interface WorkerPoolOptions {
  maxQueueSize?: number;
  maxWorkers?: number;
  minWorkers?: "max" | number;
}

/**
 * A pool to manage workers
 * @constructor
 */
export default abstract class Pool<
  TaskHandler extends Record<string, (...args: any[]) => any>,
> {
  workers: WorkerHandler[] = []; // queue with all workers
  tasks: Task[] = []; // queue with tasks awaiting execution
  pending = new Map<Task, AbortController>();
  emitter = createNanoEvents<{
    "worker-create": () => void;
    "worker-terminate": () => void;
  }>();
  #internal = createNanoEvents<{
    complete: (task: Task, payload: any) => void;
    error: (task: Task, error: any) => void;
  }>();

  maxQueueSize = Infinity;
  maxWorkers = Math.max((this.getMaxConcurrency() || 4) - 1, 1);
  minWorkers = 0;

  getMaxConcurrency() {
    return navigator.hardwareConcurrency;
  }

  constructor(options: WorkerPoolOptions = {}) {
    if (options.maxQueueSize !== undefined) {
      this.maxQueueSize = MaxQueueSize.assert(options.maxQueueSize);
    }
    if (options.maxWorkers !== undefined) {
      this.maxWorkers = MaxWorkers.assert(options.maxWorkers);
    }
    if (options.minWorkers !== undefined) {
      const minOpt = MinWorkers.assert(options.minWorkers);
      if (minOpt === "max") {
        this.minWorkers = this.maxWorkers;
      } else {
        this.minWorkers = minOpt;
        this.maxWorkers = Math.max(this.minWorkers, this.maxWorkers); // in case minWorkers is higher than maxWorkers
      }
      this.ensureMinWorkers();
    }

    const proxy: Record<string, (...args: any[]) => any> = {};
    const initHelper = (name: string) => {
      return (proxy[name] ??= (...args: any[]) => this.invoke(name, args));
    };
    this.proxy = new Proxy(proxy as ProxyMethods<TaskHandler>, {
      get: (target, prop) => {
        if (!Reflect.has(target, prop) && typeof prop === "string") {
          const helper = initHelper(prop);
          return helper;
        }
        return Reflect.get(target, prop);
      },
    });
    this.methods().then((methods) => methods.forEach(initHelper));
  }

  /**
   * @param method  the function will be stringified and executed on the worker
   * @example
   *   // offload a function
   *   function add(a, b) {
   *     return a + b
   *   };
   *   pool.eval(add, [2, 4])
   *       .then(function (result) {
   *         console.log(result); // outputs 6
   *       })
   *       .catch(function(error) {
   *         console.log(error);
   *       });
   */
  eval(
    body: string | ((...args: any) => any),
    params: any[],
    opts: Partial<InvokeOptions> = {},
  ): Promise<any> {
    return this.invoke(
      EVAL_REQ_NAME,
      [typeof body === "string" ? body : body.toString(), params],
      opts,
    );
  }

  /**
   * Execute a function on a worker.
   *
   * @example
   *   var pool = new Pool()
   *
   *   // call a function available on the worker
   *   pool.exec('fibonacci', [6])
   * @param method  the corresponding method on the worker will be executed
   * @param params  Function arguments applied when calling the function
   */
  invoke(
    method: string,
    params: any[] = [],
    opts: Partial<InvokeOptions> = {},
  ): Promise<any> {
    if (this.tasks.length >= this.maxQueueSize) {
      throw new Error("Max queue size of " + this.maxQueueSize + " reached");
    }

    const task = { method, params, transfer: opts.transfer };
    this.tasks.push(task);
    this.pending.set(task, opts.controller ?? new AbortController());
    // trigger task execution
    this.next();

    return new Promise((resolve, reject) => {
      const unbinds = [
        this.#internal.on("complete", (_task, payload) => {
          if (task !== _task) return;
          unbinds.forEach((unbind) => unbind());
          resolve(payload);
        }),
        this.#internal.on("error", (_task, error) => {
          if (task !== _task) return;
          unbinds.forEach((unbind) => unbind());
          reject(error);
        }),
      ];
    });
  }

  methods(): Promise<string[]> {
    return this.invoke(METHOD_REQ_NAME);
  }

  /**
   * a proxy for current worker.
   * Returns an object containing all methods available on the worker.
   */
  proxy: ProxyMethods<TaskHandler>;

  /**
   * Grab the first task from the queue, find a free worker, and assign the
   * worker to the task.
   */
  protected next(): void {
    if (this.tasks.length === 0) return;
    // there are tasks in the queue
    // find an available worker
    const worker = this.getWorker();
    if (!worker) return; // no available worker found, will try again when previous tasks are finished
    // get the first task from the queue
    const task = this.tasks.shift()!;
    if (!this.pending.has(task)) {
      // The task taken was already complete (either rejected or resolved), so just trigger next task in the queue
      return this.next();
    }

    // check if the task is still pending (and not cancelled -> promise rejected)
    // send the request to the worker
    const controller = this.pending.get(task)!;
    worker
      .invoke(task.method, task.params, {
        transfer: task.transfer,
        timeout: task.timeout,
        controller,
      })
      .then((val) => {
        this.#internal.emit("complete", task, val);
      })
      .catch((error) => {
        this.#internal.emit("error", task, error);
        // if the worker crashed and terminated, remove it from the pool
        if (worker.terminateState === "finished") {
          this.removeWorker(worker);
        }
      })
      .finally(() => {
        this.pending.delete(task);
        this.next();
      });
  }

  /**
   * Get an available worker. If no worker is available and the maximum number
   * of workers isn't yet reached, a new worker will be created and returned.
   * If no worker is available and the maximum number of workers is reached,
   * null will be returned.
   */
  private getWorker(): WorkerHandler | null {
    // find a non-busy worker
    for (const worker of this.workers) {
      if (!worker.busy()) {
        return worker;
      }
    }

    if (this.workers.length < this.maxWorkers) {
      // create a new worker
      const newWorker = this.initWorker();
      this.workers.push(newWorker);
      return newWorker;
    }

    return null;
  }

  /**
   * Remove a worker from the pool.
   * Attempts to terminate worker if not already terminated, and ensures the minimum
   * pool size is met.
   */
  protected async removeWorker(worker: WorkerHandler): Promise<WorkerHandler> {
    // _removeWorker will call this, but we need it to be removed synchronously
    this.removeWorkerFromList(worker);
    // If minWorkers set, spin up new workers to replace the crashed ones
    this.ensureMinWorkers();
    // terminate the worker (if not already terminated)
    await worker.terminate(false);
    this.emitter.emit("worker-terminate");
    return worker;
  }

  /**
   * Remove a worker from the pool list.
   * @param {WorkerHandler} worker
   * @protected
   */
  protected removeWorkerFromList(worker: WorkerHandler) {
    // remove from the list with workers
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }
  }

  /**
   * Close all active workers. Tasks currently being executed will be finished first.
   * @param force  If false (default), the workers are terminated
   *                                  after finishing all tasks currently in
   *                                  progress. If true, the workers will be
   *                                  terminated immediately.
   * @param timeout If provided and non-zero, worker termination promise will be rejected
   *                                  after timeout if worker process has not been terminated.
   */
  terminate(force = false, timeout?: number): Promise<void> {
    for (const ctrl of this.pending.values()) {
      ctrl.abort(new Error("Pool terminated"));
    }
    this.tasks.length = 0;
    this.pending.clear();

    return Promise.all(
      this.workers.slice().map(async (worker) => {
        try {
          await worker.terminate(force, timeout);
          this.removeWorkerFromList(worker);
        } finally {
          this.emitter.emit("worker-terminate");
        }
      }),
    ).then();
  }

  /**
   * Retrieve statistics on tasks and workers.
   */
  get stats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    pendingTasks: number;
    activeTasks: number;
  } {
    const totalWorkers = this.workers.length;
    const busyWorkers = this.workers.filter(function (worker) {
      return worker.busy();
    }).length;

    return {
      totalWorkers: totalWorkers,
      busyWorkers: busyWorkers,
      idleWorkers: totalWorkers - busyWorkers,

      pendingTasks: this.tasks.length,
      activeTasks: busyWorkers,
    };
  }

  /**
   * Ensures that a minimum of minWorkers is up and running
   */
  protected ensureMinWorkers() {
    if (this.minWorkers) {
      for (let i = this.workers.length; i < this.minWorkers; i++) {
        this.workers.push(this.initWorker());
      }
    }
  }

  initWorker(): WorkerHandler {
    const worker = this.workerCtor();
    this.emitter.emit("worker-create");
    return worker;
  }
  abstract workerCtor(): WorkerHandler;
}

const MaxWorkers = type("integer>=1");
const MaxQueueSize = type("integer>=1");
const MinWorkers = type('integer>=0|"max"');
