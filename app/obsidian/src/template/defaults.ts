import type { GeneralItemBase, ItemFields } from "@obzt/zotero-type";
import type { AnnotationHelper } from "./helper/annot";
import type { GeneralItemHelper } from "./helper/item";

export interface TemplateDataMap {
  note: GeneralItemHelper;
  filename: GeneralItemBase;
  annotation: AnnotationHelper;
  annots: AnnotationHelper[];
  citation: GeneralItemBase;
  altCitation: GeneralItemBase;
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

const note = `# <%= it.title %>
\\n
[Zotero](<%= it.backlink %>) <%= it.fileLink %>
\\n
<%~ include("annots", it.annotations) %>`,
  annots = `<% for (const annotation of it) { %>
<%~ include("annotation", annotation) %>
<% } %>`,
  annotation = `
## Page <%= it.pageLabel %> ^<%= it.blockID %>
\\n
[Zotero](<%= it.backlink %>) <%= it.fileLink %>
\\n
<%= it.textBlock %>
<%= it.imgEmbed %>
\\n
<% if (it.comment) { %>
comment: <%= it.commentMd %>
<% } %>
\\n
<% if (it.tags.length > 0) { %>
tags: <%= it.tags.map((tag) => tag.name).join(", ") %>
<% } %>`;
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
  [K in ItemFields | keyof GeneralItemBase]?: true | string;
};

export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_FRONTMATTER_FIELD: FieldsInFrontmatter = {
  title: true,
  citekey: true,
  creators: true,
};
