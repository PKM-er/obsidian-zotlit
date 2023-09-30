// @ts-ignore
import { filter, merge } from "@mobily/ts-belt/Dict";
import { getItemKeyGroupID } from "@obzt/common";
import type { AnnotationInfo, RegularItemInfoBase } from "@obzt/database";
import { Service } from "@ophidian/core";
import type { TAbstractFile, TFile } from "obsidian";
import { Notice, TFolder, Vault, parseYaml, stringifyYaml } from "obsidian";
import log, { logError } from "@/log";
import { isMarkdownFile } from "@/utils";
import { merge as mergeAnnotsTags } from "@/utils/merge";
import ZoteroPlugin from "@/zt-main";
import { ObsidianEta } from "./eta";
import { patchCompile } from "./eta/patch";
import { fromPath } from "./eta/preset";
import { ZOTERO_ATCHS_FIELDNAME, ZOTERO_KEY_FIELDNAME } from "./frontmatter";
import { extractFrontmatter } from "./get-fm";
import type { AnnotHelper, DocItemHelper } from "./helper";
import type { Context } from "./helper/base";
import type { HelperExtra } from "./helper/to-helper";
import { toHelper } from "./helper/to-helper";
import { TemplateSettings } from "./settings";

interface ColoredText {
  content: string;
  color: string | null;
  colorName: string | null;
  bgColor: string | null;
  bgColorName: string | null;
}
export interface TemplateDataMap {
  note: DocItemHelper;
  field: DocItemHelper;
  filename: RegularItemInfoBase;
  annotation: AnnotHelper;
  annots: AnnotHelper[];
  cite: RegularItemInfoBase[];
  cite2: RegularItemInfoBase[];
  colored: ColoredText;
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

  private render<T extends keyof TemplateDataMap>(
    target: T,
    obj: TemplateDataMap[T],
  ): string;
  private render(target: string, obj: any): string;
  private render(target: string, obj: any): string {
    try {
      const markdown = this.eta.render(target, obj);
      this.plugin.imgCacheImporter.flush();
      return markdown;
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
    const frontmatter = this.#renderFrontmatter(data.docItem, fm);
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
  renderCitations(extras: HelperExtra[], ctx: Context, alt = false): string {
    const data = extras.map((extra) => toHelper(extra, ctx));
    return this.render(
      alt ? "cite2" : "cite",
      data.map((d) => d.docItem),
    );
  }
  renderColored(data: ColoredText) {
    return this.render("colored", data);
  }
  renderFilename(extra: HelperExtra, ctx: Context): string {
    const data = toHelper(extra, ctx);
    return this.render("filename", data.docItem);
  }

  toFrontmatterRecord(data: DocItemHelper): {
    mode: "raw" | "parsed";
    data: Record<string, any>;
    yaml: string;
  } {
    const frontmatterString = this.render("field", data);
    let raw = false;
    const { yaml: header, body } = extractFrontmatter(frontmatterString);
    if (header) {
      try {
        if (parseYaml(header).raw === true) raw = true;
      } catch (error) {
        new Notice(`Error parsing frontmatter, ${error}`);
      }
    }
    const zoteroKey = getItemKeyGroupID(data, true),
      zoteroAtchIds = data.attachment
        ? // Obsidian field editor don't support array of numbers
          [data.attachment.itemID.toString()]
        : undefined;

    const {
      [ZOTERO_KEY_FIELDNAME]: _key,
      [ZOTERO_ATCHS_FIELDNAME]: originalAttachments,
      ...frontmatter
    } = parseYaml(body);

    return {
      mode: raw ? "raw" : "parsed",
      yaml: [
        `${ZOTERO_KEY_FIELDNAME}: ${zoteroKey}`,
        `${ZOTERO_ATCHS_FIELDNAME}: ${originalAttachments ?? zoteroAtchIds}`,
        body.trim(),
        "",
      ].join("\n"),
      data: {
        // Required keys for zotero literature note
        [ZOTERO_KEY_FIELDNAME]: zoteroKey,
        [ZOTERO_ATCHS_FIELDNAME]: zoteroAtchIds,
        ...filter(
          frontmatter,
          (v) => !(v === "" || v === null || v === undefined),
        ),
      },
    };
  }

  renderFrontmatter(
    extra: HelperExtra,
    ctx: Context,
    fm?: Record<string, any>,
  ) {
    const data = toHelper(extra, ctx);
    return this.#renderFrontmatter(data.docItem, fm);
  }

  #renderFrontmatter(item: DocItemHelper, extra?: Record<string, any>) {
    try {
      const fm = this.toFrontmatterRecord(item);
      if (fm.mode === "raw") {
        return fm.yaml;
      }
      return stringifyYaml(
        extra !== undefined ? merge(fm.data, extra) : fm.data,
      );
    } catch (err) {
      logError("Failed to renderYaml", err, item);
      new Notice("Failed to renderYaml");
      throw err;
    }
  }
  async setFrontmatterTo(file: TFile, data: DocItemHelper) {
    try {
      const record = this.toFrontmatterRecord(data).data;
      await this.plugin.app.fileManager.processFrontMatter(file, (fm) =>
        Object.assign(fm, record),
      );
    } catch (err) {
      logError("Failed to set frontmatter to file " + file.path, err, data);
      new Notice("Failed to set frontmatter to file " + file.path);
    }
  }
}
