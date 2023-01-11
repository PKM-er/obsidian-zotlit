import type {
  AnnotationInfo,
  RegularItemInfo,
  RegularItemInfoBase,
} from "@obzt/database";
import { use } from "@ophidian/core";
import * as Eta from "eta";
import type { AnnotationExtra, AnnotationHelper } from "../helper/annot";
import { withAnnotHelper } from "../helper/annot";
import type { Context } from "../helper/base";
import { revokeHelper } from "../helper/base";
import type { RegularItemInfoHelper } from "../helper/item";
import { withItemHelper } from "../helper/item";
import type { TemplateType } from "../settings";

export interface TemplateDataMap {
  note: RegularItemInfoHelper;
  filename: RegularItemInfoBase;
  annotation: AnnotationHelper;
  annots: AnnotationHelper[];
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
    annots: [data: AnnotationInfo, extra: AnnotationExtra][],
    ctx: Context,
  ) {
    const data = annots.map(([data, extra]) =>
      withAnnotHelper(data, extra, ctx),
    );
    const str = this.render("annots", data);
    revokeHelper(data);
    return str;
  }
  renderCitation(item: RegularItemInfo, alt = false) {
    return this.render(
      alt ? "altCitation" : "citation",
      item as RegularItemInfoBase,
    );
  }
  renderFilename(item: RegularItemInfo) {
    return this.render("filename", item as RegularItemInfoBase);
  }
}
