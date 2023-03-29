import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfoBase,
} from "@obzt/database";
import type { AnnotationExtra } from "./annot";
import { withAnnotHelper } from "./annot";
import { isProxied, withAttachmentHelper } from "./attachment";
import type { RegularItemInfoExtra } from "./item";
import { withDocItemHelper } from "./item";
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
  function atchToHelper<T extends AttachmentInfo | null>(attachment: T) {
    if (!attachment || isProxied(attachment)) return attachment;
    return withAttachmentHelper(attachment, ctx);
  }
  const proxiedExtra = {
    ...extra,
    attachement: atchToHelper(extra.attachment),
    allAttachments: extra.allAttachments.map(atchToHelper),
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
