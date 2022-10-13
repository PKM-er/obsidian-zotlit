/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { join, relative } from "path";
import { toPage } from "@obzt/common";
import type { AttachmentInfo } from "@obzt/database";
import { getCacheImagePath } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import {
  getCreatorName,
  AnnotationType,
  isAnnotationItem,
  getBacklink,
} from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec } from "handlebars";
import type { FileSystemAdapter } from "obsidian";
import { htmlToMarkdown } from "obsidian";

import log from "../logger.js";
import { getItemKeyGroupID } from "../note-index/index.js";
import type ZoteroPlugin from "../zt-main.js";
import type {
  AnnotationWithTags,
  ItemWithAnnots,
  WithFileContext,
} from "./const.js";

const toFileUrl = (path: string) => `file://${path}`;
const toMdLinkComponent = (path: string): string => {
  const fileUrl = toFileUrl(path);
  return encodeURI(fileUrl) === fileUrl ? fileUrl : `<${fileUrl}>`;
};

const isItemWithAnnots = (
  item: unknown,
): item is WithFileContext<ItemWithAnnots> => {
  const ia = item as WithFileContext<ItemWithAnnots>;
  return (
    Array.isArray(ia.annotations) &&
    Array.isArray(ia.attachments) &&
    "source" in ia
  );
};

const isAnnotWithTags = (
  item: unknown,
): item is WithFileContext<AnnotationWithTags> => {
  const at = item as WithFileContext<AnnotationWithTags>;
  return isAnnotationItem(at) && Array.isArray(at.tags) && "source" in at;
};

export const partial = {} as const;

const isImageAnnot = (item: unknown): item is Annotation =>
  isAnnotationItem(item) && item.type === AnnotationType.image;

export const getHelper = (plugin: ZoteroPlugin): HelperDeclareSpec => ({
  backlink(this: unknown): string {
    return getBacklink(this);
  },
  coalesce() {
    for (let i = 0; i < arguments.length - 1; i++) {
      // - 1 because last should be handlebars options var
      if (arguments[i]) {
        return arguments[i];
      }
    }
    return null;
  },
  blockID(this: unknown): string {
    if (isAnnotationItem(this)) {
      let id = getItemKeyGroupID(this);
      const page = toPage(this.position.pageIndex, true);
      if (typeof page === "number") id += `p${page}`;
      return id;
    } else return "";
  },
  commentMd(this: unknown) {
    if (isAnnotationItem(this) && this.comment) {
      return htmlToMarkdown(this.comment);
    } else return "";
  },
  imgPath(this: unknown) {
    if (isImageAnnot(this)) {
      return getCacheImagePath(this, plugin.settings.zoteroDataDir);
    } else return "";
  },
  imgUrl(this: unknown) {
    if (isImageAnnot(this)) {
      const path = getCacheImagePath(this, plugin.settings.zoteroDataDir);
      return toFileUrl(path);
    } else return "";
  },
  imgLink(this: unknown) {
    const link = imgLink(this, plugin);
    return link;
  },
  imgEmbed(this: unknown) {
    const link = imgLink(this, plugin);
    return link ? `!${link}` : null;
  },
  fileLink(this: unknown) {
    let attachment: AttachmentInfo | null = null,
      sourcePath = "",
      page: number | null = null;
    if (isItemWithAnnots(this) && this.selectedAtch?.path) {
      attachment = this.selectedAtch;
      sourcePath = this.source?.path ?? "";
    } else if (isAnnotWithTags(this) && this.attachment) {
      attachment = this.attachment;
      sourcePath = this.source?.path ?? "";
      page = toPage(this.position.pageIndex, true);
    }
    if (!attachment?.path) return null;
    const hash = page ? `#page=${page}` : undefined,
      vaultPath = (app.vault.adapter as FileSystemAdapter).getBasePath(),
      filePath = join(
        plugin.settings.zoteroDataDir,
        "storage",
        attachment.key,
        attachment.path.replace(/^storage:/, ""),
      ),
      relativePath = relative(vaultPath, filePath);
    if (relativePath.startsWith("..")) {
      return `[attachment](${toMdLinkComponent(filePath + (hash ?? ""))})`;
    } else {
      const file = app.metadataCache.getFirstLinkpathDest(relativePath, "");
      if (!file) {
        log.warn("fileLink: file not found", relativePath, filePath);
        return null;
      }
      const embed = app.fileManager.generateMarkdownLink(
        file,
        sourcePath,
        hash,
      );
      return embed.replace(/^!/, "");
    }
  },
  fullname(this: unknown) {
    return getCreatorName(this);
  },
});

export const renderFilename = (name: string) =>
  filenamify(name, { replacement: "_" });

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
  } else return null;
};
