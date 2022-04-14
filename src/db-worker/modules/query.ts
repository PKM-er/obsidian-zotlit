import log from "@log";
import { RegularItem } from "@zt-types";
import type Fuse from "fuse.js";

export const registerQuery = () => {
  Comms.handle("cb:query", async (libId, pattern, options) => {
    const fuse = Index[libId];
    if (!fuse) {
      const error = "Query before init";
      log.error(error);
      return error;
    }
    let result: Fuse.FuseResult<RegularItem>[];
    if (pattern === null) {
      let docs = (fuse as any)?._docs as RegularItem[] | undefined;
      if (!docs) {
        result = [];
      } else {
        options?.limit !== undefined && (docs = docs.slice(0, options.limit));
        result = docs.map((item, index) => ({
          item,
          refIndex: index,
        }));
      }
    } else result = fuse.search(pattern, options);
    return [[result]];
  });
};
