export interface PromiseWorker<TInput, TResult> {
  terminate(): void;
  postMessage(userMessage: TInput): Promise<TResult>;
}
export type registerPromiseWorker = <TMessageIn, TMessageOut>(
  callback: (message: TMessageIn) => Promise<TMessageOut> | TMessageOut,
) => void;

export {
  PromiseWebWorker,
  registerPromiseWebWorker,
} from "./promise-web-worker";
export {
  PromiseWorkerThread,
  registerPromiseWorkerThread,
} from "./promise-worker-thread";
