import { registerPromiseWorker } from "../promise-worker";
import type { Input, Output } from "./get-index";
import getIndex from "./get-index";

registerPromiseWorker<Input, Output>(getIndex);
