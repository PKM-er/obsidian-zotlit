import * as v from "valibot";

export const ZoteroEnumSchema = v.pipe(
  v.fallback(
    v.union([v.pipe(v.number(), v.integer(), v.minValue(0)), v.null()]),
    null,
  ),
  v.brand("zotero-enum"),
);
