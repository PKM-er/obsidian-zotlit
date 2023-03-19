// @ts-ignore
import { merge } from "@mobily/ts-belt/Dict";
import { getItemKeyGroupID } from "@obzt/common";
import type {
  AnnotationInfo,
  RegularItemInfoBase,
  TagInfo,
} from "@obzt/database";
import { TagType } from "@obzt/zotero-type";
import { use } from "@ophidian/core";
import * as Eta from "eta";
import type { TFile } from "obsidian";
import { Notice, stringifyYaml } from "obsidian";
import { logError } from "@/log";
import { merge as mergeAnnotsTags } from "@/utils/merge";
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
import type { TemplateType } from "./settings";
import { TemplateSettings } from "./settings";

export interface TemplateDataMap {
  note: DocItemHelper;
  filename: RegularItemInfoBase;
  annotation: AnnotHelper;
  annots: AnnotHelper[];
  citation: RegularItemInfoBase;
  altCitation: RegularItemInfoBase;
}

export class TemplateRenderer {
  use = use.this;

  private mergeAnnotTags(extra: HelperExtra): HelperExtra {
    if (extra.annotations.length === 0) return extra;
    const merged = mergeAnnotsTags(extra.annotations, extra.tags);
    extra.annotations = merged.annotations;
    extra.tags = { ...extra.tags, ...merged.tags };
    return extra;
  }

  private render<T extends TemplateType>(target: T, obj: TemplateDataMap[T]) {
    try {
      return Eta.templates.get(target)(obj, Eta.config);
    } catch (error) {
      console.error(
        "Error while rendering",
        target,
        JSON.stringify(obj),
        error,
      );
      throw error;
    }
  }

  renderAnnot(annotation: AnnotationInfo, extra: HelperExtra, ctx: Context) {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx, annotation);
    const str = this.render("annotation", data.annotation);
    return str;
  }
  renderNote(extra: HelperExtra, ctx: Context, fm?: Record<string, any>) {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx);
    const frontmatter = this.renderFrontmatter(data.docItem, fm);
    const content = this.render("note", data.docItem);
    return ["", frontmatter, content].join("---\n");
  }
  renderAnnots(extra: HelperExtra, ctx: Context) {
    if (ctx.merge !== false) {
      extra = this.mergeAnnotTags(extra);
    }
    const data = toHelper(extra, ctx);
    const str = this.render("annots", data.annotations);
    return str;
  }
  renderCitation(item: RegularItemInfoBase, alt = false) {
    return this.render(alt ? "altCitation" : "citation", item);
  }
  renderFilename(item: RegularItemInfoBase) {
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
    record[ZOTERO_ATCHS_FIELDNAME] = [data.attachment?.itemID];

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
