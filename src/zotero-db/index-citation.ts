import { registerPromiseWorker } from "../utils";
import type { Input, Output } from "./get-index";
import getIndex from "./get-index";

registerPromiseWorker<Input, Output>(getIndex);
