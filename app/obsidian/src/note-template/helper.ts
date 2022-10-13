/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { toPage } from "@obzt/common";
import { getCacheImagePath } from "@obzt/database";
import type { Annotation, GeneralItem } from "@obzt/zotero-type";
import {
  parseAnnotPos,
  AnnotationType,
  isAnnotationItem,
  getBacklink,
} from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { HelperDeclareSpec } from "handlebars";

import { getItemKeyGroupID } from "../note-index/index.js";
import type ZoteroPlugin from "../zt-main.js";

export const partial = {} as const;

const isImageAnnot = (item: unknown): item is Annotation =>
  isAnnotationItem(item) && item.type === AnnotationType.image;

export const getHelper = (plugin: ZoteroPlugin): HelperDeclareSpec => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backlink(this: GeneralItem | Annotation | any): string {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockID(this: Annotation | any): string {
    if (isAnnotationItem(this)) {
      let id = getItemKeyGroupID(this);
      const position = parseAnnotPos(this);
      const page = toPage(position.pageIndex, true);
      if (typeof page === "number") id += `p${page}`;
      return id;
    } else return "";
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imgPath(this: Annotation | any) {
    if (isImageAnnot(this)) {
      return getCacheImagePath(this, plugin.settings.zoteroDataDir);
    } else return "";
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
