import type { GeneralItemBase } from "@obzt/zotero-type";
import { assertNever } from "assert-never";
import { stringify } from "gray-matter";
import Handlebars from "handlebars";
import type { TFile } from "obsidian";

import { getItemKeyGroupID } from "../note-index/index.js";
import type ZoteroPlugin from "../zt-main.js";
import type {
  FieldsInFrontmatter,
  NoteTemplateJSON,
  TemplateInstances,
  TemplateItemTypeMap,
} from "./const.js";
import {
  DEFAULT_FRONTMATTER_FIELD,
  DEFAULT_TEMPLATE,
  ZOTERO_KEY_FIELDNAME,
} from "./const.js";
import { getHelper, partial, renderFilename } from "./helper.js";

const compileOptions: Parameters<typeof Handlebars.compile>[1] = {
    noEscape: true,
  },
  grayMatterOptions = {};

const emptyTemplateInstances: Record<keyof TemplateInstances, null> = {
  content: null,
  filename: null,
  annotation: null,
  annots: null,
  mdCite: null,
  altMdCite: null,
};

export default class NoteTemplate {
  private templateInstances: TemplateInstances = {
    ...emptyTemplateInstances,
  } as never;
  getAllTemplatePropNames(): (keyof TemplateItemTypeMap)[] {
    return Object.keys(this.templateInstances) as never;
  }
  private compile(target: keyof NoteTemplateJSON, template: string) {
    const delegate = Handlebars.compile(template, compileOptions);
    let renderer: (obj: never) => string;
    if (target === "content") {
      renderer = (obj: TemplateItemTypeMap[typeof target]) => {
        const content = delegate(obj);
        const frontmatterData = this.renderFrontmatter(
          obj as TemplateItemTypeMap["content"],
        );
        if (frontmatterData)
          return stringify(content, frontmatterData, grayMatterOptions);
        else return content;
      };
    } else if (target === "annots") {
      renderer = (obj: TemplateItemTypeMap[typeof target]) => {
        const content = delegate({ annotations: obj });
        return content;
      };
    } else if (target === "filename") {
      renderer = (obj: TemplateItemTypeMap[typeof target]) => {
        const filename = delegate(obj);
        return renderFilename(filename);
      };
    } else {
      renderer = delegate;
    }
    this.templateInstances[target] = renderer as never;
    if (target === "annotation" || target === "annots")
      Handlebars.registerPartial(target, delegate);
  }
  public complieAll(): void {
    for (const key of this.getAllTemplatePropNames()) {
      this.compile(key, this[key]);
    }
  }
  constructor(public plugin: ZoteroPlugin) {
    Object.assign(this, DEFAULT_TEMPLATE);
    this.frontmatter = { ...DEFAULT_FRONTMATTER_FIELD };
    Handlebars.registerPartial(partial as never);
    Handlebars.registerHelper(getHelper(plugin));
    this.complieAll();
  }

  public render<Target extends keyof NoteTemplateJSON>(
    target: Target,
    obj: TemplateItemTypeMap[Target],
    source: TFile | null = null,
  ): string {
    return this.templateInstances[target]({ ...obj, source });
  }

  private renderFrontmatter<T extends GeneralItemBase>(target: T) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    let notEmpty = false;
    // zotero-key required
    data[ZOTERO_KEY_FIELDNAME] = getItemKeyGroupID(target, true);
    for (const [k, config] of Object.entries(this.frontmatter)) {
      if (!(k in target) || config === undefined) continue;
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

  // #region default templates
  // zotero-key is an required field
  frontmatter: FieldsInFrontmatter;
  private filename!: string;
  private content!: string;
  private annots!: string;
  private annotation!: string;
  private mdCite!: string;
  private altMdCite!: string;
  // #endregion

  // #region define properties
  public setTemplateField(name: keyof NoteTemplateJSON, template: string) {
    if (template !== this[name]) {
      this.compile(name, template);
      this[name] = template;
    }
  }
  public getTemplateField(name: keyof NoteTemplateJSON) {
    return this[name];
  }
  // #endregion

  toJSON(): NoteTemplateJSON {
    return {
      content: this.content,
      filename: this.filename,
      annotation: this.annotation,
      annots: this.annots,
      mdCite: this.mdCite,
      altMdCite: this.altMdCite,
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
