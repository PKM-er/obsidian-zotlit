import { use } from "@ophidian/core";
import { EtaCore, EtaError } from "eta-prf";
import { App, type TFile } from "obsidian";
import { SettingsService } from "@/settings/base";
import { isMarkdownFile } from "@/utils";
import { resolvePath, readFile, readModTime } from "./file-handling";
import { render, renderAsync, renderString, renderStringAsync } from "./render";

export class ObsidianEta extends EtaCore {
  use = use.this;
  settings = this.use(SettingsService);
  app = this.use(App);
  tplFileCache = new WeakMap<TFile, string>();
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
        if (val === null || val === undefined) {
          return "";
        }
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val as string;
      },
      plugins: [],
      get autoTrim() {
        return self.settings.current?.autoTrim;
      },
      get views() {
        return self.settings.templateDir;
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
    const file = this.app.vault.getAbstractFileByPath(filepath);
    if (!file) return filepath;

    if (!isMarkdownFile(file)) {
      throw new EtaError(`'${filepath}' is not a markdown file`);
    }
    return file;
  }
}
