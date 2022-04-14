import dedent from "dedent";
import type { TemplateDelegate } from "handlebars";

import type { AnnotationItem, ItemField, RegularItem } from "../zotero-types";

//#region type defs

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
//#endregion

//#constants
export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_TEMPLATE: Record<keyof TemplateItemTypeMap, string> = {
  filename: "{{#filename}}{{coalesce citekey DOI title key}}.md{{/filename}}",
  content: dedent`
            # {{title}}

            [Zotero]({{backlink}})

            {{> annots}}
            `,
  annots: dedent`
            {{#each annotations}}
            {{> annotation}}
            {{/each}}`,
  annotation: dedent`

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
