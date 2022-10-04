import { enumerate } from "@obzt/common";
import { CreatorFieldMode } from "./misc.js";
import type { AnnotationType, TagType } from "./misc.js";
import type { AnnotationItem } from "./non-regular.js";

export type Item = {
  itemID: number;
  libraryID: number;
  key: string;
  groupID: number | null;
  itemType: string;
};
export type ItemField = {
  itemID: number | null;
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

export const isCreatorFullName = (
  creator: Creator,
): creator is CreatorFullName =>
  creator.fieldMode === CreatorFieldMode.fullName &&
  creator.firstName != null &&
  creator.lastName != null;
export const isCreatorNameOnly = (
  creator: Creator,
): creator is CreatorNameOnly =>
  creator.fieldMode === CreatorFieldMode.nameOnly && creator.lastName !== null;

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

export type Annotation = AnnotationItem & {
  type: AnnotationType;
  authorName: string | null;
  text: string | null;
  comment: string | null;
  color: string | null;
  pageLabel: string | null;
  sortIndex: string;
  position: string;
  parentItemID: number;
  /** key of parent item (commonly attachment) */
  parentItem: string;
};

export interface ItemTag {
  itemID: number | null;
  type: TagType;
  name: string | null;
}

export interface Attachment {
  itemID: number | null;
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
