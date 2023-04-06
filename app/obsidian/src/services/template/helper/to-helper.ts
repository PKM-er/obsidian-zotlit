import { map } from "@mobily/ts-belt/Dict";
import type { AnnotationInfo, RegularItemInfoBase } from "@obzt/database";
import type { AnnotationExtra } from "./annot";
import { withAnnotHelper } from "./annot";
import { withAttachmentHelper } from "./attachment";
import type { RegularItemInfoExtra } from "./item";
import { withDocItemHelper } from "./item";
import { withTagHelper } from "./tag";
import type { Context, AnnotHelper, DocItemHelper } from ".";

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
  const proxiedExtra = {
    ...extra,
    attachement: withAttachmentHelper(extra.attachment, ctx),
    allAttachments: extra.allAttachments.map((a) =>
      withAttachmentHelper(a, ctx),
    ),
    tags: map(extra.tags, (tags) => tags.map((t) => withTagHelper(t))),
  };
  const docItemHelper = withDocItemHelper(extra.docItem, proxiedExtra, ctx);
  const annotations = extra.annotations.map((annot) => {
    const annotHelper = withAnnotHelper(annot, proxiedExtra, ctx);
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
