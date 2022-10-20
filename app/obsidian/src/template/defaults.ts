import type { GeneralItemBase, ItemFields } from "@obzt/zotero-type";
import endent from "endent";
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
export const DEFAULT_TEMPLATE: Record<TemplateName, string> = {
  filename:
    "<%= it.citekey ?? it.DOI ?? it.title ?? it.key ?? it.citekey %>.md",
  note: endent`
            # <%= it.title %>
            \n
            [Zotero](<%= it.backlink %>) <%= it.fileLink %>
            \n
            <%~ include("annots", it.annotations) %>
            `,
  annots: endent`
            <% for (const annotation of it) { %>
            <%~ include("annotation", annotation) %>
            <% } %>`,
  annotation: endent`

            ## Page <%= it.pageLabel %> ^<%= it.blockID %>
            \n
            [Zotero](<%= it.backlink %>) <%= it.fileLink %>
            \n
            <%= it.textBlock %>
            <%= it.imgEmbed %>
            \n
            <% if (it.comment) { %>
            comment: <%= it.commentMd %>
            <% } %>
            \n
            <% if (it.tags.length > 0) { %>
            tags: <%= it.tags.map((tag) => tag.name).join(", ") %>
            <% } %>
            `,
  citation: `[@<%= it.citekey %>]`,
  altCitation: `@<%= it.citekey %>`,
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
