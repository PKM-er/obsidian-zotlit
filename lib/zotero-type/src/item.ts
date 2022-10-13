import { enumerate } from "@obzt/common";
import type { ItemAnnotations } from "./db-types.js";
import { CreatorFieldMode } from "./misc.js";
import type { TagType, AnnotationPosition } from "./misc.js";
import type { AnnotationItem } from "./non-regular.js";

export type Item = {
  itemID: number;
  libraryID: number;
  key: string;
  groupID: number | null;
  itemType: string;
};
export type ItemField = {
  itemID: number;
  fieldName: string;
  value: unknown;
};
export type ItemCreator = {
  itemID: number;
  orderIndex: number;
  creatorType: string | null;
} & Creator;

export interface Creator {
  firstName: string | null;
  lastName: string | null;
  fieldMode: CreatorFieldMode | null;
}
export type CreatorFullName = Record<"firstName" | "lastName", string> &
  Record<"fieldMode", CreatorFieldMode.fullName | null>;
export type CreatorNameOnly = {
  firstName: null;
  lastName: string;
  fieldMode: CreatorFieldMode.nameOnly;
};

export const getCreatorName = (creator: unknown): string | null => {
  if (isCreatorFullName(creator)) {
    return [creator.firstName, creator.lastName].join(" ");
  } else if (isCreatorNameOnly(creator)) {
    return creator.lastName;
  } else return null;
};

export const isCreatorFullName = (item: unknown): item is CreatorFullName => {
  const creator = item as Creator;
  return (
    creator.fieldMode === CreatorFieldMode.fullName &&
    creator.firstName !== null &&
    creator.lastName !== null
  );
};
export const isCreatorNameOnly = (item: unknown): item is CreatorNameOnly => {
  const creator = item as Creator;
  return (
    creator.fieldMode === CreatorFieldMode.nameOnly && creator.lastName !== null
  );
};

export type ItemCitekey = {
  itemID: number;
  citekey: string;
};

export type GeneralItem = GeneralItemBase & Record<string, unknown[]>;
export type GeneralItemBase = Item & {
  creators: Omit<ItemCreator, "itemID">[];
  citekey: string | null;
};

type IsNotNullable<T, K> = null extends T ? never : K;
type NotNullableKeys<T> = { [K in keyof T]-?: IsNotNullable<T[K], K> }[keyof T];

export const requiredKeys = new Set(
  enumerate<NotNullableKeys<GeneralItemBase>>()(
    "creators",
    "itemID",
    "itemType",
    "key",
    "libraryID",
  ),
);

export type Annotation = AnnotationItem &
  Omit<Required<ItemAnnotations>, "position" | "sortIndex"> & {
    sortIndex: number[];
    position: AnnotationPosition;
    /** key of parent item (commonly attachment) */
    parentItem: string;
  };

export interface ItemTag {
  itemID: number;
  tagID: number;
  type: TagType;
  name: string | null;
}

export interface Attachment {
  itemID: number;
  key: string;
  path: string | null;
}

export const nonRegularItemTypes = [
  "attachment",
  "note",
  "annotation",
] as const;

export interface LibraryInfo {
  libraryID: number | null;
  type: string;
  groupID: number | null;
}
