import type { AnnotationInfo, RegularItemInfoBase } from "@obzt/database";
import { use } from "@ophidian/core";
import * as Eta from "eta";
import type { AnnotHelper, DocItemHelper } from "./helper";
import type { Context } from "./helper/base";
import type { HelperExtra } from "./helper/to-helper";
import { toHelper } from "./helper/to-helper";
import type { TemplateType } from "./settings";

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
    const data = toHelper(extra, ctx, annotation);
    const str = this.render("annotation", data.annotation);
    return str;
  }
  renderNote(extra: HelperExtra, ctx: Context) {
    const data = toHelper(extra, ctx);
    const str = this.render("note", data.docItem);
    return str;
  }
  renderAnnots(extra: HelperExtra, ctx: Context) {
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
}
