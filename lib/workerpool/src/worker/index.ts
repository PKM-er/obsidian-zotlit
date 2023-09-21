import type { Response, BultiInMethod, Request } from "../common/interface.js";
import {
  DataRequest,
  EVAL_REQ_NAME,
  METHOD_REQ_NAME,
} from "../common/interface.js";

const compatPostMessage: typeof postMessage =
  // @ts-expect-error detect iframe
  typeof parent !== "undefined" &&
  // @ts-expect-error detect iframe
  typeof window !== "undefined" &&
  // @ts-expect-error detect iframe
  window !== parent
    ? // @ts-expect-error detect iframe
      parent.postMessage
    : postMessage;

export default class WorkerMain<
  TaskHandler extends Record<string, (...args: any[]) => any>,
> {
  methods: TaskHandler & BultiInMethod;
  constructor(methods: TaskHandler) {
    if (
      !(
        typeof self !== "undefined" &&
        typeof postMessage === "function" &&
        typeof addEventListener === "function"
      )
    )
      throw new Error("Script must be executed as a worker");

    this.methods = {
      ...methods,
      [METHOD_REQ_NAME]: () => Object.keys(methods),
      [EVAL_REQ_NAME]: (body, ...args) => {
        const func = new Function(`return (${body})`)();
        return func(...args);
      },
    };
    addEventListener("message", (evt) => this.onMessage(evt.data));
    this.send("ready");
  }

  send(data: Response, opts?: StructuredSerializeOptions) {
    compatPostMessage(data, opts);
  }

  async onMessage(data: Request) {
    const { data: request, problems } = DataRequest(data);
    if (problems) {
      return this.send({
        id: -1,
        payload: null,
        error: problems.toString(),
      });
    }
    try {
      const method = this.methods[request.method];

      if (!method) throw new Error('Unknown method "' + request.method + '"');

      // execute the function
      const result = await method.apply(method, request.params);
      this.send({
        id: request.id,
        payload: result,
        error: null,
      });
    } catch (err) {
      console.error(err);
      this.send({
        id: request.id,
        payload: null,
        error: convertError(err),
      });
    }
  }

  emit(name: string, payload: any): any {
    this.send({
      eventName: name,
      payload,
      id: -1,
      error: null,
    });
  }
}

function convertError(error: any) {
  return Object.getOwnPropertyNames(error).reduce((product, name) => {
    return Object.defineProperty(product, name, {
      value: error[name],
      enumerable: true,
    });
  }, {});
}
