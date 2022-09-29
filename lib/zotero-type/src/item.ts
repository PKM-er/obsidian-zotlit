import type { AnnotationType, TagType } from "./misc.js";

export type Item = {
  itemID: number | null;
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
  fieldMode: number | null;
  orderIndex: number;
} & Creator;

export interface Creator {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  creatorType: string | null;
}
export type CreatorFullName = Record<
  "firstName" | "lastName" | "creatorType",
  string
> &
  Record<"name", null>;
export type CreatorNameOnly = Record<"name" | "creatorType", string> &
  Record<"firstName" | "lastName", null>;

export const isCreatorFullName = (
  creator: Creator,
): creator is CreatorFullName => !!creator.firstName && !!creator.lastName;
export const isCreatorNameOnly = (
  creator: Creator,
): creator is CreatorNameOnly => !!creator.name;

export type ItemCitekey = {
  itemID: number;
  citekey: string;
};

export type GeneralItem = Item & {
  creators: Omit<ItemCreator, "itemID">[];
  citekey: string | null;
} & Record<string, unknown>;

export interface Annotation {
  itemID: number | null;
  key: string;
  libraryID: number;
  groupID: number | null;
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
}

export interface Tag {
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
