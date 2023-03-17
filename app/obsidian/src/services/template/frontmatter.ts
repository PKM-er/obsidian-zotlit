import type { RegularItemInfoBase } from "@obzt/database";
import type { ItemFields } from "@obzt/zotero-type";

/**
 * Fields that will be included in frontmatter
 * true means accept; use string to map to a alias field name
 */
export type FmFieldsMapping = {
  [K in ItemFields | keyof RegularItemInfoBase]?: true | string;
};

export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_FMFIELD_MAPPING: FmFieldsMapping = {
  title: true,
  citekey: true,
};

export const fmModes = ["whitelist", "blacklist"] as const;

export type FmMode = (typeof fmModes)[number];
