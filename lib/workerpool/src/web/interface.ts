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
  onMessage(callback: (evt: MessageEvent<any>) => any): () => void;
  onError(callback: (evt: ErrorEvent) => any): () => void;
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

export type ProxyMethods<API extends Record<string, any>> = {
  [K in keyof API]: API[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<Awaited<R>>
    : never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};
