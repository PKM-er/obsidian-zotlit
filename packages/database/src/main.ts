import { defineWorkerFns } from "worker-fn";
import { init } from "./db";

import * as annotationQuery from "./query/annotation";
import * as bibtexQuery from "./query/bibtex";
import * as collectionQuery from "./query/collection";

defineWorkerFns({
  init,
  ...annotationQuery,
  ...bibtexQuery,
  ...collectionQuery,
});
