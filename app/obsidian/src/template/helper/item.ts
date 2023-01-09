import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfo,
  TagInfo,
} from "@obzt/database";
import { getBacklink } from "@obzt/database";
import type { AnnotationExtra } from "./annot";
import { withAnnotHelper } from "./annot";
import type { Context } from "./base";
import { bindRevoke, withHelper } from "./base";
import { withCreatorHelper } from "./creator";
import { fileLink } from "./utils";

export type RegularItemInfoHelper = ReturnType<typeof withItemHelper>;
export type RegularItemInfoExtra = {
  attachment: AttachmentInfo | null;
  annotations?: [data: AnnotationInfo, extra: AnnotationExtra][];
  allAttachments: AttachmentInfo[];
  tags: TagInfo[];
};
export const withItemHelper = (
  { creators, ...data }: RegularItemInfo,
  { annotations, ..._extra }: RegularItemInfoExtra,
  ctx: Context,
) => {
  const proxiedAnnots =
    annotations?.map(([a, e]) => withAnnotHelper(a, e, ctx)) ?? null;
  const extra = proxiedAnnots
    ? { ..._extra, annotations: proxiedAnnots }
    : _extra;
  const proxiedCreators = creators.map((c) => withCreatorHelper(c));
  const proxy = withHelper({ ...data, creators: proxiedCreators }, extra, {
    backlink(): string {
      return getBacklink(this);
    },
    fileLink(): string {
      return fileLink(
        ctx.plugin.settings.database.zoteroDataDir,
        ctx.sourcePath,
        _extra.attachment,
      );
    },
  });
  bindRevoke(proxy, ...proxiedCreators, ...(proxiedAnnots ?? []));
  return proxy;
};
