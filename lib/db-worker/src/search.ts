import type { RegularItemInfo } from "@obzt/database";
import Document from "flexsearch/src/document";
import language from "flexsearch/src/lang/en.js";
import charset from "flexsearch/src/lang/latin/default.js";

export function createDocument() {
  return new Document<RegularItemInfo, true>({
    worker: true,
    charset,
    language,
    document: {
      id: "itemID",
      index: ["title", "creators[]:firstName", "creators[]:lastName", "date"],
    },
    tokenize: "full",
    // @ts-ignore
    suggest: true,
  });
}
