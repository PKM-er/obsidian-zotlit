import { getItemKeyGroupID, toPage } from "@obzt/common";
import type { AnnotationInfo, AttachmentInfo, TagInfo } from "@obzt/database";
import {
  isAnnotationItem,
  getBacklink,
  getCacheImagePath,
} from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import endent from "endent";
import { htmlToMarkdown } from "obsidian";

import type ZoteroPlugin from "../../zt-main.js";
import type { Context } from "./base";
import { withHelper } from "./base";
import { fileLink, toFileUrl, toMdLinkComponent } from "./utils.js";

export type AnnotationHelper = ReturnType<typeof withAnnotHelper>;
export type AnnotationExtra = {
  attachment: AttachmentInfo | null;
  tags: TagInfo[];
};
export const withAnnotHelper = (
  data: AnnotationInfo,
  extra: AnnotationExtra,
  { plugin, sourcePath }: Context,
) =>
  withHelper(data, extra, {
    backlink(): string {
      return getBacklink(this);
    },
    blockID(): string {
      let id = getItemKeyGroupID(this);
      const page = toPage(this.position.pageIndex, true);
      if (typeof page === "number") id += `p${page}`;
      return id;
    },
    commentMd(): string {
      if (this.comment) {
        return htmlToMarkdown(this.comment);
      } else return "";
    },
    imgPath(): string {
      if (isImageAnnot(this)) {
        return getCacheImagePath(this, plugin.settings.database.zoteroDataDir);
      } else return "";
    },
    imgUrl(): string {
      if (isImageAnnot(this)) {
        const path = getCacheImagePath(
          this,
          plugin.settings.database.zoteroDataDir,
        );
        return toFileUrl(path);
      } else return "";
    },
    imgLink(): string {
      const link = imgLink(this, plugin);
      return link;
    },
    imgEmbed(): string {
      const link = imgLink(this, plugin);
      return link ? `!${link}` : "";
    },
    fileLink(): string {
      return fileLink(
        plugin.settings.database.zoteroDataDir,
        sourcePath,
        extra.attachment,
        toPage(this.position.pageIndex, true),
      );
    },
    textBlock(): string {
      if (!this.text) return "";
      return endent`
      \`\`\`zotero-annot
      > ${this.text} [zotero](${getBacklink(this)})
      \`\`\``;
    },
    colorName() {
      switch (this.color?.toUpperCase()) {
        // from zotero.tagColorChooser
        case "#FF6666":
          return "red";
        case "#FF8C19":
          return "orange";
        case "#999999":
          return "gray";
        case "#5FB236":
          return "green";
        case "#009980":
          return "cyan";
        case "#2EA8E5":
          return "blue";
        case "#576DD9":
          return "navy";
        case "#A28AE5":
          return "purple";
        case "#A6507B":
          return "brown";
        default:
          return this.color;
      }
    },
  });

const isImageAnnot = (item: unknown): item is AnnotationInfo =>
  isAnnotationItem(item) && item.type === AnnotationType.image;

export const linktextToLink = (
  linktext: string,
  useMd: boolean,
  alt?: string,
) => {
  if (useMd) {
    return `[${alt ?? ""}](${toMdLinkComponent(linktext)})`;
  } else {
    return `[[${linktext}${alt ? "|" + alt : ""}]]`;
  }
};

const imgLink = (item: unknown, plugin: ZoteroPlugin) => {
  if (isImageAnnot(item)) {
    const linktext = plugin.imgCacheImporter.import(item);
    if (!linktext) {
      const path = plugin.imgCacheImporter.getCachePath(item);
      return `[Annotation ${item.key}](${toMdLinkComponent(path)})`;
    } else {
      return linktextToLink(linktext, app.vault.getConfig("useMarkdownLinks"));
    }
  } else return "";
};
