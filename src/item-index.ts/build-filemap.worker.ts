export type Input = string;
export type Output = Input;

import { registerPromiseWorker } from "../promise-worker";

registerPromiseWorker<Input, Output>((message) => {
  console.log("from main", message);
  message = "Hello from the worker!";
  return message;
});
