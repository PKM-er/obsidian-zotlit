import { enumerate } from "@obzt/common";
import type {
  AttachmentInfo,
  RegularItemInfoBase,
  TagInfo,
} from "@obzt/database";
import { getBacklink } from "@obzt/database";
import type { AnnotHelper } from "./annot";
import type { Context } from "./base";
import { zoteroDataDir } from "./base";
import type { CreatorHelper } from "./creator";
import { withCreatorHelper } from "./creator";
import { fileLink } from "./utils";

export type RegularItemInfoExtra = {
  attachment: AttachmentInfo | null;
  // annotations: AnnotationInfo[];
  allAttachments: AttachmentInfo[];
  tags: Record<number, TagInfo[]>;
};

const extraKeys = new Set(
  enumerate<keyof RegularItemInfoExtra>()(
    "attachment",
    "allAttachments",
    "tags",
  ),
);

export type DocItemHelper = Readonly<
  Omit<RegularItemInfoBase, "creators"> &
    Omit<RegularItemInfoExtra, "tags"> & {
      creators: CreatorHelper[];
      tags: TagInfo[];
    } & {
      backlink: string;
      fileLink: string;
    }
> & { annotations: AnnotHelper[] };

export const withDocItemHelper = (
  { creators, ...data }: RegularItemInfoBase,
  extra: RegularItemInfoExtra,
  ctx: Context,
) =>
  new Proxy(
    {
      get backlink(): string {
        return getBacklink(data);
      },
      get fileLink(): string {
        return fileLink(zoteroDataDir(ctx), ctx.sourcePath, extra.attachment);
      },
      annotations: "not-loaded",
      creators: creators.map((c) => withCreatorHelper(c)),
    },
    {
      get(target, p, receiver) {
        if (p === "tags") {
          if (!extra.tags[data.itemID]) {
            throw new Error("No tags loaded for item " + data.itemID);
          }
          return extra.tags[data.itemID];
        }
        if (extraKeys.has(p as keyof RegularItemInfoExtra)) {
          return extra[p as keyof RegularItemInfoExtra];
        }
        if (p === "annotations") {
          // if (target.annotations === "not-loaded") {
          //   throw new Error("Annotations not loaded for item " + data.itemID);
          // }
          return target.annotations;
        }
        return (
          Reflect.get(data, p, receiver) ?? Reflect.get(target, p, receiver)
        );
      },
      ownKeys(target) {
        return [
          ...Reflect.ownKeys(data),
          ...extraKeys,
          ...Reflect.ownKeys(target),
        ];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (Object.prototype.hasOwnProperty.call(data, prop)) {
          return Reflect.getOwnPropertyDescriptor(data, prop);
        }
        if (extraKeys.has(prop as keyof RegularItemInfoExtra)) {
          return Reflect.getOwnPropertyDescriptor(extra, prop);
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    },
  ) as unknown as DocItemHelper;
