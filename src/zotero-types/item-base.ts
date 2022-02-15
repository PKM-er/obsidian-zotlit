import { ItemType } from "./fields";

export interface ItemBase {
  libraryID: number;
  groupID?: number;
  version: number;
  itemType: ItemType;
  key: string;
  tags: Tag[];
  collections: any[];
  relations: any[];
  dateAdded: Date;
  dateModified: Date;
  creators?: Creator[];
}

export interface RegularItemBase extends ItemBase {
  citekey?: string;
}

export interface Tag {
  tag: string;
  /**
   * 0 or missing indicates a manually added tag
   * 1 indicates an automatically fetched tag
   */
  type?: 0 | 1;
}
export type Creator = CreatorFullName | CreatorName;
export type CreatorFullName = Record<
  "firstName" | "lastName" | "creatorType",
  string
>;
export type CreatorName = Record<"name" | "creatorType", string>;
