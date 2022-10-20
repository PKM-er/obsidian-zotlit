import { join } from "path/posix";
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
import { Notice, TFile } from "obsidian";
import log from "../logger";
import { InVaultPath } from "../settings";
import type ZoteroPlugin from "../zt-main";
import type {
  EjectableTemplate,
  NonEjectableTemplate,
  TemplateDataMap,
  TemplateName,
} from "./defaults";
import {
  TEMPLATE_FILES,
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

export { TEMPLATE_NAMES, ZOTERO_KEY_FIELDNAME } from "./defaults";

export default class NoteTemplate {
  private rawTemplates = { ...DEFAULT_TEMPLATE };
  private frontmatter = { ...DEFAULT_FRONTMATTER_FIELD };
  constructor(public plugin: ZoteroPlugin) {}

  /** use default template or use template file */
  ejected = false;
  folder = new InVaultPath("ZtTemplates");
  ready = false;

  getTemplate(name: TemplateName) {
    return this.rawTemplates[name];
  }
  getTemplateFile(name: EjectableTemplate) {
    return join(this.folder.path, TEMPLATE_FILES[name]);
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

  toJSON(): TemplateJSON {
    const { altCitation, citation, filename } = this.rawTemplates;
    return {
      ejected: this.ejected,
      folder: this.folder.path,
      templates: { altCitation, citation, filename },
    };
  }

  complie(name: TemplateName, template: string) {
    const converted = acceptLineBreak(template);
    try {
      if (!!Eta.templates.get(name) && this.rawTemplates[name] === template) {
        return;
      }
      // update saved template str and complie
      this.rawTemplates[name] = template;
      const compiled = Eta.compile(converted, { name });
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
      log.info(`Template "${name}" complie success`, converted);
    } catch (error) {
      log.error("Error compling template", name, converted, error);
    }
  }

  cacheReady = new Promise<void>((resolve) => {
    if (app.metadataCache.initialized) {
      resolve();
    } else {
      const ref = app.metadataCache.on("finished", () => {
        resolve();
        app.metadataCache.offref(ref);
      });
    }
  });

  async load(name: EjectableTemplate) {
    if (!this.ejected) {
      throw new Error("Attempt to load template from file when not ejected");
    }
    await this.cacheReady;
    const filePath = join(this.folder.path, TEMPLATE_FILES[name]);
    const af = app.vault.getAbstractFileByPath(filePath);
    if (af && !(af instanceof TFile)) {
      const msg = `Template file location occupied by a folder: ${filePath}, skipping...`;
      new Notice(msg);
      log.error(msg);
      return;
    }
    let file = af;
    let content;
    if (!file) {
      log.info("Template file not found, creating new file...", filePath);
      file = await app.fileManager.createNewMarkdownFileFromLinktext(
        filePath,
        "",
      );
      content = DEFAULT_TEMPLATE[name];
      await app.vault.modify(file, content);
    } else {
      content = await app.vault.cachedRead(file);
    }
    this.complie(name, content);
  }

  async loadAll() {
    this.ready = false;
    if (!this.ejected) {
      for (const name of TEMPLATE_NAMES) {
        this.complie(name, DEFAULT_TEMPLATE[name]);
      }
    } else {
      await Promise.all(
        TEMPLATE_NAMES.map(async (name) =>
          name in TEMPLATE_FILES
            ? this.load(name as EjectableTemplate)
            : this.complie(name, this.rawTemplates[name]),
        ),
      );
    }
    this.ready = true;
  }

  // load settings from JSON
  async updateFromJSON(json: TemplateJSON | undefined) {
    if (json) {
      if (typeof json.ejected === "boolean") {
        this.ejected = json.ejected ?? false;
      }
      if (json.folder && typeof json.folder === "string") {
        this.folder.path = json.folder;
      }
      if (json.templates) {
        const { altCitation, citation, filename } = json.templates;
        Object.assign(this.rawTemplates, { altCitation, citation, filename });
      }
    }
    await this.loadAll();
    return this;
  }
}
type TemplateJSON = {
  ejected: boolean;
  folder: string;
  templates: Record<NonEjectableTemplate, string>;
};

/** allow to use \n in file */
const acceptLineBreak = (str: string) =>
  str.replace(/((?:[^\\]|^)(?:\\{2})*)\\n/g, "$1\n");
