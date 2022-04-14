type TimerHandler = string | Function;

export type Transferable = ArrayBuffer;
/** A message received by a target object. */
export interface MessageEvent<T = any> {
  /** Returns the data of the message. */
  readonly data: T;
}
export interface MessagePortEventMap {
  message: MessageEvent;
  messageerror: MessageEvent;
}
export interface StructuredSerializeOptions {
  transfer?: Transferable[];
}

export type setInterval = (
  handler: TimerHandler,
  timeout?: number,
  ...arguments: any[]
) => number;
export type setTimeout = (
  handler: TimerHandler,
  timeout?: number,
  ...arguments: any[]
) => number;
export type clearInterval = (id?: number) => void;
export type clearTimeout = (id?: number) => void;
