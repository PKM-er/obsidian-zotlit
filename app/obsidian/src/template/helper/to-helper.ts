import type { AnnotationInfo, RegularItemInfoBase } from "@obzt/database";
import type { AnnotationExtra } from "./annot";
import type { Context, AnnotHelper, DocItemHelper } from ".";
import { withAnnotHelper } from "./annot";
import type { RegularItemInfoExtra } from "./item";
import { withDocItemHelper } from "./item";

export type HelperExtra = RegularItemInfoExtra & {
  annotations: AnnotationInfo[];
} & AnnotationExtra & {
    docItem: RegularItemInfoBase;
  };

export function toHelper(
  extra: HelperExtra,
  ctx: Context,
  annotation: AnnotationInfo,
): {
  annotation: AnnotHelper;
  annotations: AnnotHelper[];
  docItem: DocItemHelper;
};
export function toHelper(
  extra: HelperExtra,
  ctx: Context,
): {
  annotations: AnnotHelper[];
  docItem: DocItemHelper;
};
export function toHelper(
  extra: HelperExtra,
  ctx: Context,
  annotation?: AnnotationInfo,
): {
  annotation: AnnotHelper | undefined;
  annotations: AnnotHelper[];
  docItem: DocItemHelper;
} {
  const docItemHelper = withDocItemHelper(extra.docItem, extra, ctx);
  const annotations = extra.annotations.map((annot) => {
    const annotHelper = withAnnotHelper(annot, extra, ctx);
    annotHelper.docItem = docItemHelper;
    return annotHelper;
  });

  const annotHelper = annotation
    ? annotations[extra.annotations.findIndex((a) => a === annotation)]
    : undefined;

  docItemHelper.annotations = annotations;
  return {
    annotation: annotHelper,
    annotations,
    docItem: docItemHelper,
  };
}
