import { join } from "path";
import { keys, selectKeys } from "@mobily/ts-belt/Dict";
import { Service } from "@ophidian/core";
import type { TAbstractFile } from "obsidian";
import { Notice, TFile } from "obsidian";
import type {
  EjectableTemplate,
  NonEjectableTemplate,
  TemplateType,
} from "./settings";
import {
  nonEjectableTemplateTypes,
  templateTypes,
  FILE_TEMPLATE_MAP,
  ejectableTemplateTypes,
  TemplateSettings,
  TEMPLATE_FILES,
  DEFAULT_TEMPLATE,
} from "./settings";
import { isEtaFile } from "./utils";
import log, { logError } from "@/log";

export class TemplateLoader extends Service {
  settings = this.use(TemplateSettings);
  #templates: Record<EjectableTemplate, string> = selectKeys(
    DEFAULT_TEMPLATE,
    keys(TEMPLATE_FILES),
  );
  getTemplate(name: TemplateType) {
    return (
      this.settings.templates[name as NonEjectableTemplate] ??
      this.#templates[name as EjectableTemplate]
    );
  }

  async onload() {
    this.registerEvent(app.vault.on("modify", this.onModifyFile, this));
    await this.loadTemplates("full");
    await this.settings.apply("autoPairEta");
  }

  async onModifyFile(file: TAbstractFile) {
    if (!this.settings.ejected) {
      return;
    }
    const type = this.getTemplateTypeOf(file);
    if (!type) return;
    const prev = this.#templates[type],
      curr = await app.vault.cachedRead(file as TFile);
    if (prev === curr) return;
    this.#templates[type] = curr;
    app.vault.trigger("zotero:template-updated", type);
  }

  get folder() {
    return this.settings.folder;
  }
  getTemplateTypeOf(file: TAbstractFile): EjectableTemplate | undefined {
    if (
      file instanceof TFile &&
      file.parent.path === this.folder &&
      isEtaFile(file)
    ) {
      return FILE_TEMPLATE_MAP[file.name];
    }
    return;
  }

  async loadTemplates(mode: "full" | "eject" | "noneject" = "full") {
    if (mode !== "noneject" && this.settings.ejected) {
      await this.#cacheReady;
      this.#templates = await this.#loadFromFiles();
    }

    const templates =
      mode === "eject"
        ? ejectableTemplateTypes
        : mode === "noneject"
        ? nonEjectableTemplateTypes
        : templateTypes;

    for (const type of templates) {
      app.vault.trigger("zotero:template-updated", type);
    }
  }

  #cacheReady = new Promise<void>((resolve) => {
    if (app.metadataCache.initialized) {
      resolve();
    } else {
      const ref = app.metadataCache.on("finished", () => {
        resolve();
        app.metadataCache.offref(ref);
      });
      this.registerEvent(ref);
    }
  });

  getTemplateFile(name: EjectableTemplate) {
    return join(this.folder, TEMPLATE_FILES[name]);
  }

  async #load(name: EjectableTemplate): Promise<string> {
    const filePath = this.getTemplateFile(name);
    const file = app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
      return await app.vault.cachedRead(file);
    }

    const defaultTemplate = DEFAULT_TEMPLATE[name];
    if (!file) {
      log.debug("Template file not found, creating new file...", filePath);
      await app.fileManager.createNewMarkdownFile(
        app.vault.getRoot(),
        filePath,
        defaultTemplate,
      );
    } else {
      // file instanceof TFolder
      const msg = `Template file location occupied by a folder: ${filePath}, skipping...`;
      new Notice(msg);
      logError(msg, null);
    }
    return defaultTemplate;
  }
  async #loadFromFiles() {
    return Object.fromEntries(
      await Promise.all(
        ejectableTemplateTypes.map(
          async (n) => [n, await this.#load(n)] as const,
        ),
      ),
    ) as Record<EjectableTemplate, string>;
  }
}
