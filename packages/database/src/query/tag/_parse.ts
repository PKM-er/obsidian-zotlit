import { ZoteroEnumSchema } from "@/lib/zt-enum";
import * as v from "valibot";
import type { TagQueryRawResult } from "./_sql";

export function parseTag({
  itemTags,
  name,
  tagId,
}: TagQueryRawResult): TagQueryResult {
  return {
    tagId,
    name,
    items: itemTags.map(({ itemId, type, item: { key } }) => ({
      itemId,
      key,
      tagType: v.parse(ZoteroEnumSchema, type),
    })),
  };
}

export interface TagQueryResult {
  tagId: number;
  name: string;
  items: {
    itemId: number;
    key: string;
    tagType: TagTypeValue;
  }[];
}

type TagTypeValue = v.InferOutput<typeof ZoteroEnumSchema>;
