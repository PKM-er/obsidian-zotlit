import type { AttachmentInfo } from "@obzt/database";
import type {
  Annotation,
  GeneralItemBase,
  ItemFields,
  ItemTag,
} from "@obzt/zotero-type";
import endent from "endent";

// #region type defs

export type AnnotationWithTags = Annotation & {
  tags: ItemTag[];
};

export type ItemWithAnnots<I extends GeneralItemBase = GeneralItemBase> = I & {
  annotations: AnnotationWithTags[];
  attachments: AttachmentInfo[];
  selectedAtch: AttachmentInfo | null;
};
export interface TemplateItemTypeMap {
  content: ItemWithAnnots;
  filename: GeneralItemBase;
  annotation: AnnotationWithTags;
  annots: AnnotationWithTags[];
  mdCite: GeneralItemBase;
  altMdCite: GeneralItemBase;
}
export type FieldsInFrontmatter = {
  [K in ItemFields | keyof GeneralItemBase]?: true | string[];
};

export type TemplateInstances = {
  [key in keyof TemplateItemTypeMap]: (obj: TemplateItemTypeMap[key]) => string;
};
export type NoteTemplateJSON = Record<keyof TemplateItemTypeMap, string>;
// #endregion

// #constants
export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export const DEFAULT_TEMPLATE: Record<keyof TemplateItemTypeMap, string> = {
  filename: "{{coalesce citekey DOI title key}}.md",
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
            {{#if imgEmbed}}{{imgEmbed}}{{/if}}
            {{#if comment}}comment: {{commentMd}}{{/if}}
            {{#each tags}}#{{name}} {{/each}}
            `,
  mdCite: `[@{{citekey}}]`,
  altMdCite: `@{{citekey}}`,
};

export const DEFAULT_FRONTMATTER_FIELD: FieldsInFrontmatter = {
  title: true,
  citekey: true,
};
