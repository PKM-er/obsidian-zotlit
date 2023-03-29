import { join, relative } from "path";
import type { AnnotationInfo, AttachmentInfo } from "@obzt/database";
import { isAnnotationItem } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { FileSystemAdapter, TFile } from "obsidian";
import log from "@/log";
import type ZoteroPlugin from "@/zt-main";

export const toFileUrl = (path: string) => `file://${path}`;
export const toMdLinkComponent = (url: string): string => {
  return encodeURI(url) === url ? url : `<${url}>`;
};

export const isEtaFile = (file: TFile) => file.name.endsWith(".eta.md");

export const getAttachmentPath = (
  dataDir: string,
  attachment: AttachmentInfo,
): string => {
  if (!attachment.path) return "";
  return join(
    dataDir,
    "storage",
    attachment.key,
    attachment.path.replace(/^storage:/, ""),
  );
};

export const fileLink = (
  dataDir: string,
  sourcePath?: string | null,
  attachment: AttachmentInfo | null = null,
  page: number | null = null,
): string => {
  if (!attachment?.path) return "";
  const hash = page ? `#page=${page}` : undefined,
    vaultPath = (app.vault.adapter as FileSystemAdapter).getBasePath(),
    filePath = getAttachmentPath(dataDir, attachment),
    relativePath = relative(vaultPath, filePath);
  if (relativePath.startsWith("..")) {
    // file outside of vault
    return `[attachment](${toMdLinkComponent(
      toFileUrl(filePath + (hash ?? "")),
    )})`;
  } else {
    const file = app.metadataCache.getFirstLinkpathDest(relativePath, "");
    if (!file) {
      log.warn("fileLink: file not found", relativePath, filePath);
      return "";
    }
    const embed = app.fileManager.generateMarkdownLink(
      file,
      sourcePath ?? "",
      hash,
    );
    return embed.replace(/^!/, "");
  }
};
export const renderFilename = (name: string): string =>
  filenamify(name, { replacement: "_" });

export const acceptLineBreak = (str: string) =>
  str.replace(/((?:[^\\]|^)(?:\\{2})*)\\n/g, "$1\n");

export const isImageAnnot = (item: unknown): item is AnnotationInfo =>
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

export const imgLink = (item: unknown, plugin: ZoteroPlugin) => {
  if (isImageAnnot(item)) {
    const linktext = plugin.imgCacheImporter.import(item);
    if (!linktext) {
      const path = plugin.imgCacheImporter.getCachePath(item);
      return `[Annotation ${item.key}](${toMdLinkComponent(toFileUrl(path))})`;
    } else {
      return linktextToLink(linktext, app.vault.getConfig("useMarkdownLinks"));
    }
  } else return "";
};
