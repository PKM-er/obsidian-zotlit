import type { RegularItemInfoBase } from "@obzt/database";
import type { ItemFields } from "@obzt/zotero-type";
import type { AnnotationHelper } from "../helper/annot";
import type { RegularItemInfoHelper } from "../helper/item";

export interface TemplateDataMap {
  note: RegularItemInfoHelper;
  filename: RegularItemInfoBase;
  annotation: AnnotationHelper;
  annots: AnnotationHelper[];
  citation: RegularItemInfoBase;
  altCitation: RegularItemInfoBase;
}

export type TemplateName = keyof TemplateDataMap;

// templates
// ├─ zt-annot.eta.md
// ├─ zt-annots.eta.md
// └─ zt-note.eta.md

export type EjectableTemplate = "note" | "annotation" | "annots";
export const TEMPLATE_FILES: Record<
  Extract<TemplateName, EjectableTemplate>,
  string
> = {
  note: "zt-note.eta.md",
  annotation: "zt-annot.eta.md",
  annots: "zt-annots.eta.md",
};
export type NonEjectableTemplate = Exclude<TemplateName, EjectableTemplate>;
export const EJECTABLE_TEMPLATE_NAMES = Object.keys(
  TEMPLATE_FILES,
) as EjectableTemplate[];

import annotation from "./zt-annot.ejs";
import annots from "./zt-annots.ejs";
import note from "./zt-note.ejs";

export const DEFAULT_TEMPLATE: Record<TemplateName, string> = {
  filename:
    "<%= it.citekey ?? it.DOI ?? it.title ?? it.key ?? it.citekey %>.md",
  note,
  annots,
  annotation,
  citation: "[@<%= it.citekey %>]",
  altCitation: "@<%= it.citekey %>",
};

export const TEMPLATE_NAMES = Object.keys(DEFAULT_TEMPLATE) as TemplateName[];

export type NoteTemplateJSON = Record<TemplateName, string>;

/**
 * Fields that will be included in frontmatter
 * true means accept; use string to map to a alias field name
 */
export type FieldsInFrontmatter = {
  [K in ItemFields | keyof RegularItemInfoBase]?: true | string;
};

export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_FRONTMATTER_FIELD: FieldsInFrontmatter = {
  title: true,
  citekey: true,
  creators: true,
};
