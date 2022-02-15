// derived https://github.com/nolanlawson/promise-worker

import assertNever from "assert-never";
import log from "loglevel";
import { Worker as WorkerThread } from "worker_threads";

import { PromiseWorker, registerPromiseWorker } from ".";
import {
  isWorkerMessage,
  MainMessage,
  WorkerMessage,
  WorkerMessageCallbackArg,
} from "./misc";

/**
 * A wrapper class to promisify web workers
 */
export class PromiseWorkerThread<TInput, TResult, TWorkerData = undefined>
  implements PromiseWorker<TInput, TResult>
{
  private _worker!: WorkerThread;
  private _callbacks = new Map<
    number,
    (msg: WorkerMessageCallbackArg<TResult>) => any
  >();

  /**
   * Spawn worker
   */
  private spawn() {
    const worker = this.getWorker(this.workerData);
    this._worker = worker;
    worker
      .on("message", (evt: MessageEvent) => {
        let { data: msg } = evt;
        // Ignore - this message is not for us.
        if (
          !isWorkerMessage<TResult>(msg) ||
          !this._callbacks.has(msg.messageId)
        )
          return;

        this._callbacks.get(msg.messageId)!(msg);
        this._callbacks.delete(msg.messageId);
      })
      .on("error", (err) => {
        this._callbacks.forEach((cb) => cb({ type: "error", result: err }));
        this._callbacks.clear();
      })
      .on("exit", (code) => {
        this._callbacks.forEach((cb) =>
          cb({ type: "error", result: new Error("worker died") }),
        );
        this._callbacks.clear();

        if (code !== 0) {
          log.error(`worker exited with code ${code}`);
          this.spawn(); // Worker died unexpectedly, so spawn a new one
        }
      });
  }

  /**
   * Pass in the worker instance to promisify
   *
   * @param getWorker function to get worker instance
   */
  constructor(
    private getWorker: (workerData: TWorkerData | undefined) => WorkerThread,
    private workerData?: TWorkerData,
  ) {
    this.spawn();
  }

  public terminate(): void {
    this._worker.terminate();
  }

  /**
   * Send a message to the worker
   *
   * The message you send can be any object, array, string, number, etc.
   * Note that the message will be `JSON.stringify`d, so you can't send functions, `Date`s, custom classes, etc.
   *
   * @param userMessage Data or message to send to the worker
   * @returns Promise resolved with the processed result or rejected with an error
   */
  public postMessage(userMessage: TInput): Promise<TResult> {
    let messageId = +new Date();

    let messageToSend: MainMessage<TInput> = [messageId, userMessage];

    return new Promise((resolve, reject) => {
      this._callbacks.set(messageId, (msg) => {
        if (msg.type === "error") {
          reject(new Error(msg.result.message));
        } else if (msg.type === "result") {
          resolve(msg.result);
        } else assertNever(msg);
      });

      this._worker.postMessage(messageToSend);
    });
  }
}

/**
 * Make this worker a promise-worker
 * @param callback Callback function for processing the inbound data
 */
export const registerPromiseWorkerThread: registerPromiseWorker = <
  TMessageIn,
  TMessageOut,
  TWorkerData = undefined,
>(
  callback: (
    message: TMessageIn,
    workerData: TWorkerData,
  ) => Promise<TMessageOut> | TMessageOut,
): void => {
  const { workerData, parentPort } = require("worker_threads");
  const postOutgoingMessage = (data: WorkerMessage<TMessageOut>) => {
    if (data.type === "error") {
      if (typeof console !== "undefined" && "error" in console) {
        console.error("Worker caught an error:", data.result);
      }
    }
    parentPort.postMessage(data);
  };

  parentPort.on("message", async (e: MessageEvent<MainMessage<TMessageIn>>) => {
    let payload = e.data;
    if (!Array.isArray(payload) || payload.length !== 2) {
      // message doens't match communication format; ignore
      return;
    }
    const [messageId, message] = payload;
    if (typeof callback !== "function") {
      return postOutgoingMessage({
        messageId,
        type: "error",
        result: "Please pass a function into register().",
      });
    }
    try {
      postOutgoingMessage({
        messageId,
        type: "result",
        result: await callback(message, workerData),
      });
    } catch (err) {
      postOutgoingMessage({ messageId, type: "error", result: err });
    }
  });
};
