import { defineWorkerFns } from "worker-fn";
import { init } from "./db";
import {
  getAnnotationsByParentItem,
  getAnnotationsByKey,
} from "./query/annotation";
import { getBibtexCitekeys, getBibtexIds } from "./query/bibtex";

defineWorkerFns({
  init,
  getAnnotationsByParentItem,
  getAnnotationsByKey,
  getBibtexCitekeys,
  getBibtexIds,
});
