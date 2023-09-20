import type { Request } from "../common/interface.js";

export interface WorkerCompat {
  send(message: Request, options?: StructuredSerializeOptions): void;
  readyPromise: Promise<true>;
  killed: boolean;
  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/postMessage)
   */
  postMessage(message: any, transfer: Transferable[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
  /**
   * Aborts worker's associated global environment.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/terminate)
   */
  terminate(): void;
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface Task {
  method: string;
  params: any[];
  transfer?: Transferable[];
  timeout?: number;
}

export interface TaskWithId extends Task {
  id: number;
}

export interface InvokeOptions {
  controller: AbortController;
  transfer: Transferable[];
  timeout: number;
}
