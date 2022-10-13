/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { toPage } from "@obzt/common";
import { getCacheImagePath } from "@obzt/database";
import type { Annotation } from "@obzt/zotero-type";
import {
  AnnotationType,
  isAnnotationItem,
  getBacklink,
} from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec } from "handlebars";
import { htmlToMarkdown } from "obsidian";

import { getItemKeyGroupID } from "../note-index/index.js";
import type ZoteroPlugin from "../zt-main.js";

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
      const path = getCacheImagePath(this, plugin.settings.zoteroDataDir),
        fileUrl = `file://${path}`,
        fileUrlEncoded = encodeURI(fileUrl);
      return fileUrlEncoded;
    } else return "";
  },
  imgLink(this: unknown) {
    if (isImageAnnot(this)) {
      const path = getCacheImagePath(this, plugin.settings.zoteroDataDir),
        fileUrl = `file://${path}`,
        fileUrlEncoded = encodeURI(fileUrl),
        fileUrlMarkdown = fileUrl === fileUrlEncoded ? fileUrl : `<${fileUrl}>`;
      return `[Annotation ${this.key}](${fileUrlMarkdown})`;
    } else return "";
  },
  imgEmbed(this: unknown) {
    if (isImageAnnot(this)) {
      const path = getCacheImagePath(this, plugin.settings.zoteroDataDir),
        fileUrl = `file://${path}`,
        fileUrlEncoded = encodeURI(fileUrl),
        fileUrlMarkdown = fileUrl === fileUrlEncoded ? fileUrl : `<${fileUrl}>`;
      return `![Annotation ${this.key}](${fileUrlMarkdown})`;
    } else return "";
  },
});

export const renderFilename = (name: string) =>
  filenamify(name, { replacement: "_" });
