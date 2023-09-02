import { use } from "@ophidian/core";
import { EtaCore, EtaError } from "eta-prf";
import type { TFile } from "obsidian";
import { isMarkdownFile } from "@/utils";
import ZoteroPlugin from "@/zt-main";
import { resolvePath, readFile, readModTime } from "./file-handling";
import { render, renderAsync, renderString, renderStringAsync } from "./render";

const acceptLineBreak = {
  processTemplate: (str: string) =>
    str.replace(/((?:[^\\]|^)(?:\\{2})*)\\n/g, "$1\n"),
};

export class ObsidianEta extends EtaCore {
  use = use.this;
  plugin = this.use(ZoteroPlugin);
  tplFileCache = new WeakMap<TFile, string>();
  get settings() {
    return this.plugin.settings.template;
  }
  constructor() {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.config = {
      ...this.config,
      cache: true,
      autoEscape: false,
      autoFilter: true,
      filterFunction: (val: unknown): string => {
        if (typeof val === undefined || val === null) {
          return "";
        }
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val as string;
      },
      plugins: [acceptLineBreak],
      get autoTrim() {
        return self.settings.autoTrim;
      },
      get views() {
        return self.settings.folder;
      },
    };
  }
  resolvePath = resolvePath;
  readFile = readFile;
  readModTime = readModTime;
  render = render;
  renderAsync = renderAsync;
  renderString = renderString;
  renderStringAsync = renderStringAsync;

  /**
   * @returns filepath if file not found
   */
  getFile(filepath: string): TFile | string {
    const file = this.plugin.app.vault.getAbstractFileByPath(filepath);
    if (!file) return filepath;

    if (!isMarkdownFile(file)) {
      throw new EtaError(`'${filepath}' is not a markdown file`);
    }
    return file;
  }
}
