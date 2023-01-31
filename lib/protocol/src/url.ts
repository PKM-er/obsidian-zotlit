/* eslint-disable @typescript-eslint/naming-convention */
import { assertNever } from "assert-never";
import type { ParseOptions, StringifyOptions } from "query-string";
import { stringifyUrl } from "query-string";
export { parseUrl, stringifyUrl, parse } from "query-string";

export const parseOptions: ParseOptions = {
  parseBooleans: true,
  arrayFormat: "index",
  parseNumbers: true,
};

export const stringifyOptions: StringifyOptions = {
  arrayFormat: "index",
};

export type QueryAction = "open" | "export";

export const stringifyQuery = <A extends QueryAction>(
  url: `obsidian://zotero/${A}`,
  obj: ItemsQuery | AnnotationsQuery,
) => {
  if (obj.type === "item") {
    const query = {
      version: obj.version,
      type: obj.type,
      items: obj.items.map((i) => JSON.stringify(i)),
    };
    return stringifyUrl({ url, query }, stringifyOptions);
  } else if (obj.type === "annotation") {
    const query = {
      version: obj.version,
      type: obj.type,
      annots: obj.annots.map((i) => JSON.stringify(i)),
      parent: JSON.stringify(obj.parent),
    };
    return stringifyUrl({ url, query }, stringifyOptions);
  } else {
    assertNever(obj);
  }
};

const toItems = (query: Record<string, string>, key: string) => {
  const pattern = new RegExp(`^${key}\\[(\\d+)\\]$`);
  return Object.entries(query)
    .filter(([key]) => pattern.test(key))
    .sort(
      ([key1], [key2]) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Number(key1.match(pattern)![1]) - Number(key2.match(pattern)![1]),
    )
    .map(([, val]) => JSON.parse(val));
};

export const parseQuery = (
  query: Record<string, string>,
): AnnotationsQuery | ItemsQuery => {
  if (query.type === "item") {
    return {
      version: query.version,
      type: query.type,
      items: toItems(query, "items"),
    };
  } else if (query.type === "annotation") {
    return {
      version: query.version,
      type: query.type,
      annots: toItems(query, "annots"),
      parent: JSON.parse(query.parent),
    };
  } else {
    throw new TypeError("Unrecognized query type: " + query.type);
  }
};

export interface ItemQuery {
  key: string;
  id: number;
  libraryID: number;
  groupID?: number;
}
export interface AnnotationsQuery {
  version: string;
  type: "annotation";
  annots: ItemQuery[];
  parent: ItemQuery;
}

export interface ItemsQuery {
  version: string;
  type: "item";
  items: ItemQuery[];
}
