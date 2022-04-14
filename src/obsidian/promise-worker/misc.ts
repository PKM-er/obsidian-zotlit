export type WorkerMessage<T> = Record<"messageId", number> &
  WorkerMessageCallbackArg<T>;
export type WorkerMessageCallbackArg<T> =
  | { type: "error"; result: any }
  | { type: "result"; result: T };
export type MainMessage<T> = [messageId: number, message: T];
const props = ["messageId", "type", "result"] as const;
export const isWorkerMessage = <T>(msg: any): msg is WorkerMessage<T> =>
  Object.keys(msg).every((key) => props.includes(key as any));
