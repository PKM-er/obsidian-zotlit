/* eslint-disable @typescript-eslint/naming-convention */
import { pathToFileURL } from "url";
import { enumerate, getItemKeyGroupID, toPage } from "@obzt/common";
import type { AnnotationInfo, AttachmentInfo, TagInfo } from "@obzt/database";
import { getBacklink, getCacheImagePath } from "@obzt/database";
import { htmlToMarkdown } from "obsidian";

import { fileLink, imgLink, isImageAnnot } from "../utils.js";
import type { Context } from "./base.js";
import { zoteroDataDir } from "./base.js";
import colors from "./colors.json";
import type { DocItemHelper } from "./item.js";

export type AnnotHelper = Readonly<
  AnnotationInfo &
    Omit<AnnotationExtra, "tags"> & {
      tags: TagInfo[];
      docItem: DocItemHelper;
    } & Record<
      | "backlink"
      | "blockID"
      | "commentMd"
      | "imgPath"
      | "imgUrl"
      | "imgLink"
      | "imgEmbed"
      | "fileLink"
      | "textBlock"
      | "colorName",
      string
    >
> & {
  docItem: DocItemHelper;
};

const extraKeys = new Set(
  enumerate<keyof AnnotationExtra>()("attachment", "tags"),
);

export const withAnnotHelper = (
  data: AnnotationInfo,
  extra: AnnotationExtra,
  ctx: Context,
) =>
  new Proxy(
    {
      /** pdf page number (1-based) */
      get page(): number {
        return toPage(data.position.pageIndex, true) ?? NaN;
      },
      get backlink(): string {
        return getBacklink(data);
      },
      get blockID(): string {
        let id = getItemKeyGroupID(data);
        const page = toPage(data.position.pageIndex, true);
        if (typeof page === "number") id += `p${page}`;
        return id;
      },
      get commentMd(): string {
        if (data.comment) {
          return htmlToMarkdown(data.comment);
        } else return "";
      },
      /**
       * return the absolute path of the image file in file system
       */
      get imgPath(): string {
        if (isImageAnnot(this)) {
          return getCacheImagePath(this, zoteroDataDir(ctx));
        } else return "";
      },
      get imgUrl(): string {
        if (isImageAnnot(this)) {
          const path = getCacheImagePath(this, zoteroDataDir(ctx));
          return pathToFileURL(path).href;
        } else return "";
      },
      get imgLink(): string {
        const link = imgLink(this, ctx.plugin);
        return link;
      },
      get imgEmbed(): string {
        const link = imgLink(this, ctx.plugin);
        return link ? `!${link}` : "";
      },
      get fileLink(): string {
        return fileLink(
          zoteroDataDir(ctx),
          ctx.plugin.app,
          ctx.sourcePath,
          extra.attachment,
          toPage(data.position.pageIndex, true),
        );
      },
      get textBlock(): string {
        if (!data.text) return "";
        return (
          "```zotero-annot\n" +
          `> ${data.text} [zotero](${getBacklink(data)})\n` +
          "```"
        );
      },
      get colorName() {
        const color = data.color?.toUpperCase();
        return colors[color as keyof typeof colors] || this.color;
      },
      docItem: "not-loaded",
    },
    {
      get(target, p, receiver) {
        if (p === "tags") {
          if (!extra.tags[data.itemID]) {
            console.error(extra, data.itemID);
            throw new Error("No tags loaded for item " + data.itemID);
          }
          return extra.tags[data.itemID];
        }
        if (p === "docItem") {
          if (target.docItem === "not-loaded") {
            throw new Error("Doc Item not loaded for item " + data.itemID);
          }
          return target.docItem;
        }
        if (extraKeys.has(p as keyof AnnotationExtra)) {
          return Reflect.get(extra, p, receiver);
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
        if (extraKeys.has(prop as keyof AnnotationExtra)) {
          return Reflect.getOwnPropertyDescriptor(extra, prop);
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    },
  ) as unknown as AnnotHelper;

export type AnnotationExtra = {
  attachment: AttachmentInfo | null;
  tags: Record<number, TagInfo[]>;
};
