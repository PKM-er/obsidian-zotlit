import { registerPromiseWebWorker } from "../../promise-worker";
import type { Input, Output } from "../get-index";
import getIndex from "../get-index";

registerPromiseWebWorker<Input, Output>(getIndex);
