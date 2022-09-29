import type { Annotation, GeneralItem } from "@obzt/database";
import type { ItemFields } from "@obzt/zotero-type";
import endent from "endent";
import type { TemplateDelegate } from "handlebars";

// #region type defs

export type ItemWithAnnots<I extends GeneralItem = GeneralItem> = I & {
  annotations?: Annotation[];
};
export interface TemplateItemTypeMap {
  content: ItemWithAnnots;
  filename: GeneralItem;
  annotation: Annotation;
  annots: Annotation[];
  mdCite: GeneralItem;
  altMdCite: GeneralItem;
}
export type FieldsInFrontmatter = {
  [K in ItemFields | keyof GeneralItem]?: true | string[];
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
  content: endent`
            # {{title}}

            [Zotero]({{backlink}})

            {{> annots}}
            `,
  annots: endent`
            {{#each annotations}}
            {{> annotation}}
            {{/each}}`,
  annotation: endent`

            ## Annotation ^{{blockID}}

            [Zotero]({{backlink}})

            {{#if text}}> {{text}}{{/if}}
            `,
  mdCite: `[@{{citekey}}]`,
  altMdCite: `@{{citekey}}`,
};

export const DEFAULT_FRONTMATTER_FIELD: FieldsInFrontmatter = {
  title: true,
  citekey: true,
};
