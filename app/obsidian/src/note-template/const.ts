import type { AnnotationItem, ItemField, RegularItem } from "@obzt/zotero-type";
import endent from "endent";
import type { TemplateDelegate } from "handlebars";

// #region type defs

export type ItemWithAnnos<I extends RegularItem = RegularItem> = I & {
  annotations?: AnnotationItem[];
};
export interface TemplateItemTypeMap {
  content: ItemWithAnnos;
  filename: RegularItem;
  annotation: AnnotationItem;
  annots: AnnotationItem[];
  mdCite: RegularItem;
  altMdCite: RegularItem;
}
export type FieldsInFrontmatter = {
  [K in ItemField | keyof RegularItem]?: true | string[];
};

export type TemplateInstances = {
  [key in keyof TemplateItemTypeMap]: TemplateDelegate<
    TemplateItemTypeMap[key]
  >;
};
export type NoteTemplateJSON = Record<keyof TemplateItemTypeMap, string>;
// #endregion

// #constants
export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_TEMPLATE: Record<keyof TemplateItemTypeMap, string> = {
  filename: "{{#filename}}{{coalesce citekey DOI title key}}.md{{/filename}}",
  content: endent.default`
            # {{title}}

            [Zotero]({{backlink}})

            {{> annots}}
            `,
  annots: endent.default`
            {{#each annotations}}
            {{> annotation}}
            {{/each}}`,
  annotation: endent.default`

            ## Annotation ^{{blockID}}

            [Zotero]({{backlink}})

            {{#if annotationText}}> {{annotationText}}{{/if}}
            `,
  mdCite: `[@{{citekey}}]`,
  altMdCite: `@{{citekey}}`,
};

export const DEFAULT_FRONTMATTER_FIELD: FieldsInFrontmatter = {
  title: true,
  citekey: true,
};
