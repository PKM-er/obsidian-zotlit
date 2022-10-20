import { getItemKeyGroupID } from "@obzt/common";
import type {
  Annotation,
  Creator,
  GeneralItem,
  GeneralItemBase,
} from "@obzt/zotero-type";
import { getCreatorName } from "@obzt/zotero-type";
import * as Eta from "eta";
import { stringify } from "gray-matter";
import log from "../logger";
import type ZoteroPlugin from "../zt-main";
import type {
  NoteTemplateJSON,
  TemplateDataMap,
  TemplateName,
} from "./defaults";
import {
  ZOTERO_KEY_FIELDNAME,
  DEFAULT_FRONTMATTER_FIELD,
  DEFAULT_TEMPLATE,
  TEMPLATE_NAMES,
} from "./defaults";
import type { AnnotationExtra } from "./helper/annot";
import { withAnnotHelper } from "./helper/annot";
import type { Context } from "./helper/base";
import { revokeHelper } from "./helper/base";
import { withItemHelper } from "./helper/item";
import { renderFilename } from "./helper/utils";

Eta.configure({ autoEscape: false });
const grayMatterOptions = {};

// templates
// ├─ zt-annot
// │   ├─ template0.md
// │   └─ ...
// ├─ zt-annots
// │   ├─ template0.md
// │   └─ ...
// └─ zt-note
//     ├─ template0.md
//     └─ ...

export { TEMPLATE_NAMES, ZOTERO_KEY_FIELDNAME } from "./defaults";

export default class NoteTemplate {
  private rawTemplates = { ...DEFAULT_TEMPLATE };
  private frontmatter = { ...DEFAULT_FRONTMATTER_FIELD };
  constructor(public plugin: ZoteroPlugin) {
    this.complieAll();
  }

  getTemplate(name: TemplateName) {
    return this.rawTemplates[name];
  }

  complie(name: TemplateName, template?: string) {
    try {
      if (template) {
        // update saved template str and complie
        if (this.rawTemplates[name] === template) {
          return;
        }
        this.rawTemplates[name] = template;
      } else {
        // (re)complie existing template str
        template = this.rawTemplates[name];
      }
      const compiled = Eta.compile(template, { name });
      let full: typeof compiled;
      switch (name) {
        case "filename":
          full = (data, opts) => renderFilename(compiled(data, opts));
          break;
        case "note":
          full = (data, opts) => {
            const content = compiled(data, opts);
            const frontmatterData = this.toFrontmatterData(
              data as unknown as TemplateDataMap["note"],
            );
            if (frontmatterData)
              return stringify(content, frontmatterData, grayMatterOptions);
            else return content;
          };
          break;
        default:
          full = compiled;
          break;
      }
      Eta.templates.define(name, full);
      log.info(`Template "${name}" complie success`, template);
    } catch (error) {
      log.error("Error compling template", name, template, error);
    }
  }
  complieAll() {
    Eta.templates.reset();
    for (const name of TEMPLATE_NAMES) {
      this.complie(name);
    }
  }
  private render<T extends TemplateName>(target: T, obj: TemplateDataMap[T]) {
    return Eta.templates.get(target)(obj, Eta.config);
  }
  renderAnnot(...args: Parameters<typeof withAnnotHelper>) {
    const data = withAnnotHelper(...args);
    const str = this.render("annotation", data);
    revokeHelper(data);
    return str;
  }
  renderNote(...args: Parameters<typeof withItemHelper>) {
    const data = withItemHelper(...args);
    const str = this.render("note", data);
    revokeHelper(data);
    return str;
  }
  renderAnnots(
    annots: [data: Annotation, extra: AnnotationExtra][],
    ctx: Context,
  ) {
    const data = annots.map(([data, extra]) =>
      withAnnotHelper(data, extra, ctx),
    );
    const str = this.render("annots", data);
    revokeHelper(data);
    return str;
  }
  renderCitation(item: GeneralItem, alt = false) {
    return this.render(
      alt ? "altCitation" : "citation",
      item as GeneralItemBase,
    );
  }
  renderFilename(item: GeneralItem) {
    return this.render("filename", item as GeneralItemBase);
  }

  private toFrontmatterData<T extends GeneralItemBase>(target: T) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    let notEmpty = false;
    // zotero-key required
    data[ZOTERO_KEY_FIELDNAME] = getItemKeyGroupID(target, true);
    for (const [k, config] of Object.entries(this.frontmatter)) {
      // if don't have value, skip
      if (!(k in target) || config === undefined) continue;
      const key = k as keyof T,
        value = target[key];
      if (config === true) {
        // use full name for creators in frontmatter
        if (key === "creators") {
          data[k] = (value as Creator[]).map((c) => getCreatorName(c));
        } else data[k] = value;
      } else {
        // map value to an alias name
        data[config] = value;
      }
      notEmpty = true;
    }
    return notEmpty ? data : null;
  }

  toJSON(): NoteTemplateJSON {
    return this.rawTemplates;
  }
  updateFromJSON(json: NoteTemplateJSON | undefined): this {
    if (json) {
      Object.assign(this.rawTemplates, json, {
        // additional fields that need to be manually converted
      });
    }
    this.complieAll();
    return this;
  }
}
