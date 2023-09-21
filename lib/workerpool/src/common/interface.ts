/* eslint-disable @typescript-eslint/naming-convention */
import { scope } from "arktype";

export type Request = typeof DataRequest.infer;
export type Response = typeof DataResponse.infer | "ready";

export const { DataRequest, DataResponse } = scope({
  DataRequest: {
    id: "number",
    method: "string",
    params: "any[]",
  },
  DataResponse: {
    id: "number",
    "eventName?": "string",
    payload: "any",
    error: "any",
  },
}).compile();

export interface Resolver {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export const METHOD_REQ_NAME = "__METHODS__";
export const EVAL_REQ_NAME = "__EVAL__";

export interface BultiInMethod {
  [METHOD_REQ_NAME](): string[];
  [EVAL_REQ_NAME](body: string, ...args: any[]): any;
}
