import { join, relative } from "path";
import type { AttachmentInfo } from "@obzt/database";
import filenamify from "filenamify";
import type { FileSystemAdapter, TFile } from "obsidian";
import log from "@log";

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

/** allow to use \n in file */
export const acceptLineBreak = (str: string) =>
  str.replace(/((?:[^\\]|^)(?:\\{2})*)\\n/g, "$1\n");
