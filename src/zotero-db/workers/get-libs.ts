import { registerPromiseWebWorker } from "../../promise-worker";
import type { Input, Output } from "../get-libs";
import getLibs from "../get-libs";

registerPromiseWebWorker<Input, Output>(getLibs);
