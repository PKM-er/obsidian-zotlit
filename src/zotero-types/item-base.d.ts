import { ItemType } from "./fields";

export interface ItemBase {
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

interface Tag {
  tag: string;
  /**
   * 0 or missing indicates a manually added tag
   * 1 indicates an automatically fetched tag
   */
  type?: 0 | 1;
}
type Creator =
  | Record<"firstName" | "lastName" | "creatorType", string>
  | Record<"name" | "creatorType", string>;
