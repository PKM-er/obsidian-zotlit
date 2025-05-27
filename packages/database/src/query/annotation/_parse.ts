import {
  parseAnnotationPosition,
  type AnnotationPosition,
} from "@/lib/position";
import { parseSortIndex, type SortIndex } from "@/lib/sort-index";
import { ZoteroEnumSchema } from "@/lib/zt-enum";
import * as v from "valibot";
import type { AnnotationQueryRawResult } from "./_sql";

type AnnotationTypeValue = v.InferOutput<typeof ZoteroEnumSchema>;

export type AnnotationQueryResult = {
  parentItemId: number | null;
  parentItemKey: string | null;
  key: string;
  libraryId: number;
  itemId: number;
  authorName: string | null;
  text: string | null;
  comment: string | null;
  color: string | null;
  pageLabel: string | null;
  isExternal: number;
  sortIndex: SortIndex | null;
  position: AnnotationPosition | null;
  type: AnnotationTypeValue;
  groupId: number | null;
};

export function parseAnnotation({
  position,
  sortIndex,
  type,
  ...rest
}: AnnotationQueryRawResult): AnnotationQueryResult {
  return {
    ...rest,
    type: v.parse(ZoteroEnumSchema, type),
    sortIndex: parseSortIndex(sortIndex, () => rest),
    position: parseAnnotationPosition(position, () => rest),
  };
}
