import { isAbsolute, join, relative } from "node:path/posix";
import type { Eta as EtaCore } from "eta-prf";
import { EtaError } from "eta-prf";
import { normalizePath } from "obsidian";
import { Template, fromPath, toFilename } from "./preset";
import type { ObsidianEta } from ".";

function completePath(filepath: string): string {
  if (!filepath) {
    return "";
  }
  // check if reserving filename
  const builtIn = toFilename(filepath);
  if (builtIn) return builtIn;

  // regular path resolving
  if (filepath.endsWith(".eta.md")) {
    return filepath;
  }
  if (filepath.endsWith(".eta")) {
    return filepath + ".md";
  }
  return filepath + ".eta.md";
}

interface Options {
  /** Compile to async function */
  async?: boolean;

  /** Absolute path to template file */
  filepath?: string;
}

export function readFile(this: ObsidianEta, filepath: string): string {
  const builtIn = fromPath(filepath, this.settings.folder);
  if (builtIn?.type === "embeded") {
    return this.settings.templates[builtIn.name];
  }
  const file = this.getFile(filepath);
  if (typeof file === "string") {
    if (!builtIn) throw new EtaError(`File '${filepath}' not found`);
    // use default template
    return Template.Ejectable[builtIn.name];
  }
  if (!this.tplFileCache.has(file)) {
    throw new EtaError(`File '${filepath}' not loaded`);
  }
  return this.tplFileCache.get(file)!;
}

/**
 * @returns -1: always update; undefined: never update
 */
export function readModTime(
  this: ObsidianEta,
  filepath: string,
): number | undefined {
  const builtIn = fromPath(filepath, this.settings.folder);
  if (builtIn?.type === "embeded") {
    return -1;
  }
  const file = this.getFile(filepath);
  if (typeof file === "string") {
    if (!builtIn) throw new EtaError(`File '${filepath}' not found`);
    // use default template
    return undefined;
  }
  if (!this.tplFileCache.has(file)) {
    throw new EtaError(`File '${filepath}' not loaded`);
  }
  return file.stat.mtime;
}

export function resolvePath(
  this: Pick<EtaCore, "config" | "filepathCache">,
  templatePath: string,
  options?: Partial<Options>,
): string {
  let resolvedFilePath = "";

  const views = this.config.views;

  if (!views) {
    throw new EtaError("Views directory is not defined");
  }

  const baseFilePath = options && options.filepath;

  // how we index cached template paths
  const cacheIndex = JSON.stringify({
    filename: baseFilePath,
    path: templatePath,
    views: this.config.views,
  });

  templatePath = completePath(templatePath);

  // if the file was included from another template
  if (baseFilePath) {
    // check the cache

    if (this.config.cacheFilepaths && this.filepathCache[cacheIndex]) {
      return this.filepathCache[cacheIndex];
    }

    if (isAbsolute(templatePath)) {
      resolvedFilePath = join(views, normalizePath(templatePath));
    } else {
      resolvedFilePath = join(baseFilePath, "..", normalizePath(templatePath));
    }
  } else {
    resolvedFilePath = join(views, templatePath);
  }

  if (dirIsChild(views, resolvedFilePath)) {
    // add resolved path to the cache
    if (baseFilePath && this.config.cacheFilepaths) {
      this.filepathCache[cacheIndex] = resolvedFilePath;
    }

    return resolvedFilePath;
  } else {
    throw new EtaError(
      `Template '${templatePath}' is not in the views directory`,
    );
  }
}

function dirIsChild(parent: string, dir: string) {
  const relativePath = relative(parent, dir);
  return (
    relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath)
  );
}
