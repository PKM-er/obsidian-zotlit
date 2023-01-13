import { join, relative } from "path";
import type { AnnotationInfo, AttachmentInfo } from "@obzt/database";
import { isAnnotationItem } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import filenamify from "filenamify";
import type { FileSystemAdapter, TFile } from "obsidian";
import log from "../../logger";
import type ZoteroPlugin from "../../zt-main";

export const toFileUrl = (path: string) => `file://${path}`;
export const toMdLinkComponent = (path: string): string => {
  const fileUrl = toFileUrl(path);
  return encodeURI(fileUrl) === fileUrl ? fileUrl : `<${fileUrl}>`;
};

export const isEtaFile = (file: TFile) => file.name.endsWith(".eta.md");

export const fileLink = (
  dataDir: string,
  sourcePath?: string | null,
  attachment: AttachmentInfo | null = null,
  page: number | null = null,
): string => {
  if (!attachment?.path) return "";
  const hash = page ? `#page=${page}` : undefined,
    vaultPath = (app.vault.adapter as FileSystemAdapter).getBasePath(),
    filePath = join(
      dataDir,
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
      return `[Annotation ${item.key}](${toMdLinkComponent(path)})`;
    } else {
      return linktextToLink(linktext, app.vault.getConfig("useMarkdownLinks"));
    }
  } else return "";
};
