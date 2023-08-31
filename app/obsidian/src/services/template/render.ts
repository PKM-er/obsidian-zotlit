// @ts-ignore
import { merge } from "@mobily/ts-belt/Dict";
import { getItemKeyGroupID } from "@obzt/common";
import type {
  AnnotationInfo,
  RegularItemInfoBase,
  TagInfo,
} from "@obzt/database";
import { TagType } from "@obzt/zotero-type";
import { Service } from "@ophidian/core";
import type { TAbstractFile, TFile } from "obsidian";
import { Notice, TFolder, Vault, stringifyYaml } from "obsidian";
import log, { logError } from "@/log";
import { isMarkdownFile } from "@/utils";
import { merge as mergeAnnotsTags } from "@/utils/merge";
import ZoteroPlugin from "@/zt-main";
import { ObsidianEta } from "./eta";
import { patchCompile } from "./eta/patch";
import { fromPath } from "./eta/preset";
import type { FmFieldsMapping } from "./frontmatter";
import {
  ZOTERO_ATCHS_FIELDNAME,
  blacklistIgnore,
  ZOTERO_KEY_FIELDNAME,
} from "./frontmatter";
import type { AnnotHelper, DocItemHelper } from "./helper";
import type { Context } from "./helper/base";
import type { HelperExtra } from "./helper/to-helper";
import { toHelper } from "./helper/to-helper";
import { TemplateSettings } from "./settings";

export interface TemplateDataMap {
  note: DocItemHelper;
  filename: RegularItemInfoBase;
  annotation: AnnotHelper;
  annots: AnnotHelper[];
  citation: RegularItemInfoBase;
  altCitation: RegularItemInfoBase;
}

export class TemplateRenderer extends Service {
  eta = this.use(ObsidianEta);
  plugin = this.use(ZoteroPlugin);
  get vault() {
    return this.plugin.app.vault;
  }
  get folder() {
    return this.use(TemplateSettings).folder;
  }

  async loadTemplates() {
    const folder = this.vault.getAbstractFileByPath(this.folder);
    if (!folder) return;
    if (!(folder instanceof TFolder)) {
      log.warn("Template folder is occupied by a file");
      return;
    }
    const templates: TFile[] = [];
    Vault.recurseChildren(folder, async (f) => {
      if (!isMarkdownFile(f) || !f.path.endsWith(".eta.md")) return;
      templates.push(f);
    });
    await Promise.all(
      templates.map(async (f) =>
        this.eta.tplFileCache.set(f, await this.vault.cachedRead(f)),
      ),
    );
  }
  async onload() {
    patchCompile(this.eta);
    await this.loadTemplates();
    this.registerEvent(this.vault.on("create", this.onFileChange, this));
    this.registerEvent(this.vault.on("modify", this.onFileChange, this));
    this.registerEvent(
      this.vault.on("delete", async (f) => {
        if (!isMarkdownFile(f)) return;
        const tplOld = this.fromPath(f.path);
        if (!tplOld) return;
        this.eta.tplFileCache.delete(f);
        this.vault.trigger("zotero:template-updated", tplOld);
      }),
    );
    this.registerEvent(
      this.vault.on("rename", async (f, oldPath) => {
        await this.onFileChange(f);
        const tplOld = this.fromPath(oldPath);
        if (!tplOld) return;
        this.vault.trigger("zotero:template-updated", tplOld);
      }),
    );
  }

  private async onFileChange(f: TAbstractFile) {
    if (!isMarkdownFile(f)) return;
    const tpl = this.fromPath(f.path);
    this.eta.tplFileCache.set(f, await this.vault.cachedRead(f));
    this.vault.trigger("zotero:template-updated", tpl);
  }

  private fromPath(filepath: string) {
    const tpl = fromPath(filepath, this.folder);
    return tpl?.type === "ejectable" ? tpl.name : null;
  }
  onFileUpdate(file: TAbstractFile) {
    if (!isMarkdownFile(file)) return;

    this.fromPath(file.path);
  }
  onFileRename(file: TAbstractFile, oldPath: string) {
    if (isMarkdownFile(file)) {
      this.fromPath(file.path);
    }
    this.fromPath(oldPath);
  }

  private mergeAnnotTags(extra: HelperExtra): HelperExtra {
    if (extra.annotations.length === 0) return extra;
    const merged = mergeAnnotsTags(extra.annotations, extra.tags);
    extra.annotations = merged.annotations;
    extra.tags = { ...extra.tags, ...merged.tags };
    return extra;
  }

  private render<T extends string>(
    target: T,
    obj: T extends keyof TemplateDataMap ? TemplateDataMap[T] : any,
  ) {
    try {
      return this.eta.render(target, obj);
    } catch (error) {
      console.error(
        "Error while rendering",
        target,
        // JSON.stringify(obj),
        error,
      );
      throw error;
    }
  }

  renderAnnot(
    annotation: AnnotationInfo,
    extra: HelperExtra,
    ctx: Context,
  ): string {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx, annotation);
    const str = this.render("annotation", data.annotation);
    return str;
  }
  renderNote(
    extra: HelperExtra,
    ctx: Context,
    fm?: Record<string, any>,
  ): string {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx);
    const frontmatter = this.renderFrontmatter(data.docItem, fm);
    const content = this.render("note", data.docItem);
    return ["", frontmatter, content].join("---\n");
  }
  renderAnnots(extra: HelperExtra, ctx: Context): string {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx);
    const str = this.render("annots", data.annotations);
    return str;
  }
  renderCitation(item: RegularItemInfoBase, alt = false): string {
    return this.render(alt ? "altCitation" : "citation", item);
  }
  renderFilename(item: RegularItemInfoBase): string {
    return this.render("filename", item);
  }

  toFrontmatterRecord(data: DocItemHelper) {
    const {
      fmFieldsMode: mode,
      fmFieldsMapping: mapping,
      fmTagPrefix: tagPrefix,
    } = this.use(TemplateSettings);
    const record: Record<string, any> = {};
    // Required key for annotation note
    record[ZOTERO_KEY_FIELDNAME] = getItemKeyGroupID(data, true);
    if (data.attachment?.itemID) {
      record[ZOTERO_ATCHS_FIELDNAME] = [data.attachment.itemID];
    }

    // eslint-disable-next-line prefer-const
    for (let [key, val] of Object.entries(data as Record<string, any>)) {
      if (mode === "blacklist" && blacklistIgnore.has(key)) {
        continue;
      }
      if (key === "tags") {
        val = (val as TagInfo[])
          // only include manually added tags for now
          .filter((tag) => tag.type === TagType.manual)
          .map((v) => (tagPrefix ?? "") + v.name);
      }
      const action = mapping[key as keyof FmFieldsMapping];
      if (typeof action === "string") {
        record[action] = val;
      } else if (
        (mode === "whitelist" && action === undefined) ||
        (mode === "blacklist" && action === true)
      ) {
        continue;
      } else {
        record[key] = val;
      }
    }
    return record;
  }

  renderFrontmatter(item: DocItemHelper, extra?: Record<string, any>) {
    try {
      const record = this.toFrontmatterRecord(item);
      const str = stringifyYaml(
        extra !== undefined ? merge(record, extra) : record,
      );
      return str;
    } catch (err) {
      logError(
        "Failed to renderYaml",
        err,
        item,
        this.use(TemplateSettings).fmFieldsMode,
        this.use(TemplateSettings).fmFieldsMapping,
      );
      new Notice("Failed to renderYaml");
    }
  }
  async setFrontmatterTo(file: TFile, data: DocItemHelper) {
    try {
      const record = this.toFrontmatterRecord(data);
      await app.fileManager.processFrontMatter(file, (fm) =>
        Object.assign(fm, record),
      );
    } catch (err) {
      logError(
        "Failed to set frontmatter to file " + file.path,
        err,
        data,
        this.use(TemplateSettings).fmFieldsMode,
        this.use(TemplateSettings).fmFieldsMapping,
      );
      new Notice("Failed to set frontmatter to file " + file.path);
    }
  }
}
