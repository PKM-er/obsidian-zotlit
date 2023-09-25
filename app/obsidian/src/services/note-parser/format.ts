/* eslint-disable @typescript-eslint/naming-convention */
import { scope } from "arktype";

// uri like http://zotero.org/users/6775115/items/C689D5Q2
const itemURI = /^https?:\/\/zotero\.org\/.*\/items\/([A-Z\d]+)$/;
export function keyFromItemURI(uri: string) {
  const match = uri.match(itemURI);
  if (!match) return null;
  return match[1];
}

export const { DataCitation, DataAnnotation } = scope({
  CitationItem: {
    uris: [itemURI],
  },
  DataCitation: {
    citationItems: "CitationItem[]",
    "properties?": "any",
    "locator?": "string",
  },
  DataAnnotation: {
    attachmentURI: itemURI,
    annotationKey: "string",
    citationItem: "CitationItem",
  },
}).compile();
