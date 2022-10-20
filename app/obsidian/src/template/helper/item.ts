import type { AttachmentInfo } from "@obzt/database";
import type { Annotation, GeneralItem, ItemTag } from "@obzt/zotero-type";
import { getBacklink } from "@obzt/zotero-type";
import type { AnnotationExtra } from "./annot";
import { withAnnotHelper } from "./annot";
import type { Context } from "./base";
import { bindRevoke, withHelper } from "./base";
import { withCreatorHelper } from "./creator";
import { fileLink } from "./utils";

export type GeneralItemHelper = ReturnType<typeof withItemHelper>;
export type GeneralItemExtra = {
  attachment: AttachmentInfo | null;
  annotations: [data: Annotation, extra: AnnotationExtra][];
  allAttachments: AttachmentInfo[];
  tags: ItemTag[];
};
export const withItemHelper = (
  { creators, ...data }: GeneralItem,
  { annotations, ...extra }: GeneralItemExtra,
  ctx: Context,
) => {
  const proxiedAnnots = annotations.map(([a, e]) => withAnnotHelper(a, e, ctx));
  const proxiedCreators = creators.map((c) => withCreatorHelper(c));
  const proxy = withHelper(
    { ...data, creators: proxiedCreators },
    { ...extra, annotations: proxiedAnnots },
    {
      backlink(): string {
        return getBacklink(this);
      },
      fileLink(): string {
        return fileLink(
          ctx.plugin.settings.zoteroDataDir,
          ctx.sourcePath,
          extra.attachment,
        );
      },
    },
  );
  bindRevoke(proxy, ...proxiedAnnots, ...proxiedCreators);
  return proxy;
};
