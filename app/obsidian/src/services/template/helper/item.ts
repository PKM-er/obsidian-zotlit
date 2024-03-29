import { enumerate } from "@obzt/common";
import type {
  AttachmentInfo,
  NoteInfo,
  RegularItemInfoBase,
  TagInfo,
} from "@obzt/database";
import { getBacklink } from "@obzt/database";
import { fileLink } from "../utils";
import type { AnnotHelper } from "./annot";
import type { Context } from "./base";
import { zoteroDataDir } from "./base";
import { withCollectionHelper } from "./collection";
import type { CreatorHelper } from "./creator";
import { withCreatorHelper } from "./creator";

export interface RegularItemInfoExtra {
  attachment: AttachmentInfo | null;
  // annotations: AnnotationInfo[];
  allAttachments: AttachmentInfo[];
  tags: Record<number, TagInfo[]>;
  notes: NoteNormailzed[];
}

export type NoteNormailzed = NoteInfo & { content: string };

const extraKeys = new Set(
  enumerate<keyof RegularItemInfoExtra>()(
    "attachment",
    "allAttachments",
    "tags",
    "notes",
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
      authors: string[];
    }
> & { annotations: AnnotHelper[] };

export const withDocItemHelper = (
  {
    creators: _creators,
    collections: _collections,
    ...data
  }: RegularItemInfoBase,
  extra: RegularItemInfoExtra,
  ctx: Context,
) => {
  const creators = _creators.map((c) => withCreatorHelper(c));
  return new Proxy(
    {
      get backlink(): string {
        return getBacklink(data);
      },
      get fileLink(): string {
        return fileLink(
          zoteroDataDir(ctx),
          ctx.plugin.app,
          ctx.sourcePath,
          extra.attachment,
        );
      },
      get authorsShort(): string {
        const authors = this.authors;
        if (!authors.length) return "";
        const firstAuthor = authors[0];
        const firstAuthorName = firstAuthor.lastName ?? firstAuthor.fullname;
        if (authors.length === 1) {
          return firstAuthorName;
        } else {
          return `${firstAuthorName} et al.`;
        }
      },
      annotations: "not-loaded",
      creators,
      collections: _collections.map((c) => withCollectionHelper(c)),
      get authors() {
        return creators.filter((c) => c.creatorType === "author");
      },
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
};
