import assertNever from "assert-never";
import dedent from "dedent";
import { stringify } from "gray-matter";
import Handlebars, { TemplateDelegate } from "handlebars";

import { RegularItem } from "../zotero-types";
import { AnnotationItem, ItemFields } from "../zotero-types/fields";

export type ItemWithAnnos<I extends RegularItem = RegularItem> = I & {
  annotations?: AnnotationItem[];
};
interface TemplateItemTypeMap {
  content: ItemWithAnnos;
  filename: RegularItem;
  annotation: AnnotationItem;
  annots: AnnotationItem[];
}
type FieldsInFrontmatter = {
  [K in ItemFields | keyof RegularItem]?: true | string[];
};

type TemplateInstances = {
  [key in keyof TemplateItemTypeMap]: TemplateDelegate<
    TemplateItemTypeMap[key]
  >;
};
type NoteTemplateJSON = Record<keyof TemplateItemTypeMap, string>;

const CompileOptions: Parameters<typeof Handlebars.compile>[1] = {
    noEscape: true,
  },
  grayMatterOptions = {};

export const ZOTERO_KEY_FIELDNAME = "zotero-key";

export default class NoteTemplate {
  private templateInstances: TemplateInstances = {
    content: undefined as any,
    filename: undefined as any,
    annotation: undefined as any,
    annots: undefined as any,
  };
  getAllTemplatePropNames(): (keyof TemplateItemTypeMap)[] {
    return Object.keys(this.templateInstances) as any;
  }
  private compile(name: keyof NoteTemplateJSON, template: string) {
    const tpl = Handlebars.compile(template, CompileOptions);
    this.templateInstances[name] = tpl as any;
    if (name === "annotation" || name === "annots")
      Handlebars.registerPartial(name, tpl);
  }
  public complieAll(): void {
    for (const key of this.getAllTemplatePropNames()) {
      this.compile(key, this[key]);
    }
  }
  constructor() {
    this.complieAll();
  }

  public render<Target extends keyof NoteTemplateJSON>(
    target: Target,
    obj: TemplateItemTypeMap[Target],
  ): string {
    const renderWith = (obj: any) => this.templateInstances[target](obj);
    if (target === "content") {
      const content = renderWith(obj);
      const frontmatterData = this.renderFrontmatter(
        obj as TemplateItemTypeMap["content"],
      );
      if (frontmatterData)
        return stringify(content, frontmatterData, grayMatterOptions);
    } else if (target === "annots") {
      return renderWith({ annotations: obj });
    }
    return renderWith(obj);
  }

  frontmatter: FieldsInFrontmatter = {
    title: true,
  };
  private renderFrontmatter<T extends RegularItem>(target: T) {
    let data: Record<string, any> = {};
    let notEmpty = false;
    // zotero-key required
    data[ZOTERO_KEY_FIELDNAME] = target.key;
    for (const [k, config] of Object.entries<string[] | true>(
      this.frontmatter,
    )) {
      if (!(k in target)) continue;
      const value = target[k as keyof T];
      if (config === true) {
        data[k] = value;
      } else if (Array.isArray(config)) {
        // map value to an alias name
        new Set(config).forEach((alias) => (data[alias] = value));
      } else {
        assertNever(config);
      }
      notEmpty = true;
    }
    return notEmpty ? data : null;
  }

  //#region default templates
  private filename: string = "{{key}}.md";
  private content: string = dedent`
  # {{title}}
  
  {{> annots}}
  `;
  private annots: string = dedent`
  {{#each annotations}}
  {{> annotation}}
  {{/each}}
  `;
  private annotation: string = dedent`

  ## Annotation ^{{key}}

  {{#if annotationText}}> {{annotationText}}{{/if}}
  `;
  //#endregion

  //#region define properties
  private setTplField(name: keyof NoteTemplateJSON, template: string) {
    if (template !== this[name]) {
      this.compile(name, template);
      this[name] = template;
    }
  }

  public get contentTpl() {
    return this.content;
  }
  public set contentTpl(template: string) {
    this.setTplField("content", template);
  }

  public get filenameTpl() {
    return this.filename;
  }
  /**
   * pass normalized path
   */
  public set filenameTpl(normalizedPath: string) {
    this.setTplField("filename", normalizedPath);
  }

  public get annotationTpl() {
    return this.annotation;
  }
  public set annotationTpl(template: string) {
    this.setTplField("annotation", template);
  }

  public get annotsTpl() {
    return this.annots;
  }
  public set annotsTpl(template: string) {
    this.setTplField("annots", template);
  }
  //#endregion

  toJSON(): NoteTemplateJSON {
    return {
      content: this.content,
      filename: this.filename,
      annotation: this.annotation,
      annots: this.annots,
    };
  }
  updateFromJSON(json: NoteTemplateJSON | undefined): this {
    if (json) {
      Object.assign(this, json, {
        // additional fields need to be manually converted
      });
    }
    this.complieAll();
    return this;
  }
}
