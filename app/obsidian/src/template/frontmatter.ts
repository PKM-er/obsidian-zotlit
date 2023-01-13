import type { RegularItemInfoBase } from "@obzt/database";
import type { ItemFields } from "@obzt/zotero-type";

/**
 * Fields that will be included in frontmatter
 * true means accept; use string to map to a alias field name
 */
export type FieldsInFrontmatter = {
  [K in ItemFields | keyof RegularItemInfoBase]?: true | string;
};

export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const FMFIELD_MAPPING: FieldsInFrontmatter = {
  title: true,
  citekey: true,
};

export interface FmWhiteList {
  mode: "whitelist";
  mapping: FieldsInFrontmatter;
}

export interface FmBlackList {
  mode: "blacklist";
  mapping: FieldsInFrontmatter;
}
