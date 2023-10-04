export interface Deferred<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

export function deferred<T>(): Deferred<T> {
  let resolve: Deferred<T>["resolve"];
  let reject: Deferred<T>["reject"];
  const promise: Promise<T> = new Promise((res, rej) => {
    (resolve = res), (reject = rej);
  });
  /** @ts-ignore */
  return { resolve, reject, promise };
}
