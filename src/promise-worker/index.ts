export interface PromiseWorker<TInput = any, TResult = any> {
  terminate(): void;
  postMessage(userMessage: TInput): Promise<TResult>;
}
export type registerPromiseWorker = <TMessageIn, TMessageOut>(
  callback: (message: TMessageIn) => Promise<TMessageOut> | TMessageOut,
) => void;
export type getPromiseWorker<Input = any, Output = any> = (inst: {
  ConfigPath: string;
}) => PromiseWorker<Input, Output>;

export {
  PromiseWebWorker,
  registerPromiseWebWorker,
} from "./promise-web-worker";
export {
  PromiseWorkerThread,
  registerPromiseWorkerThread,
} from "./promise-worker-thread";
