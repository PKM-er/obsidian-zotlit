/* eslint-disable @typescript-eslint/naming-convention */
import { scope } from "arktype";

// uri like http://zotero.org/users/6775115/items/C689D5Q2
export const citationUri = /^https?:\/\/zotero\.org\/.*\/items\/([A-Z\d]+)$/;
export const { DataCitation } = scope({
  CitationItem: {
    uris: [citationUri],
  },
  DataCitation: {
    citationItems: "CitationItem[]",
    properties: "any",
  },
}).compile();
