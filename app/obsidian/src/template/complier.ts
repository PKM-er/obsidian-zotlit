import { Service } from "@ophidian/core";
import * as Eta from "eta";
import { Notice } from "obsidian";
import log from "@log";
import { TemplateLoader } from "./loader";
import type { TemplateType } from "./settings";
import { defaultEtaConfig } from "./settings";
import { acceptLineBreak, renderFilename } from "./utils";

export class TemplateComplier extends Service {
  loader = this.use(TemplateLoader);

  async onload() {
    this.registerEvent(
      app.vault.on("zotero:template-updated", this.onTemplateUpdated, this),
    );
    Eta.configure(defaultEtaConfig);
  }

  onTemplateUpdated(template: TemplateType) {
    this.complie(template);
  }

  complie(name: TemplateType) {
    const template = this.loader.getTemplate(name);
    const converted = acceptLineBreak(template);
    try {
      const compiled = Eta.compile(converted, { name });
      let full: typeof compiled;
      switch (name) {
        case "filename":
          full = (data, opts) => renderFilename(compiled(data, opts));
          break;
        default:
          full = compiled;
          break;
      }
      Eta.templates.define(name, full);
      log.trace(`Template "${name}" complie success`, converted);
    } catch (error) {
      log.error("Error compling template", name, converted, error);
      new Notice(`Error compling template "${name}", error: ${error}`);
    }
  }
}

declare module "obsidian" {
  interface Vault {
    on(
      name: "zotero:template-updated",
      callback: (template: TemplateType) => any,
      ctx?: any,
    ): EventRef;
    trigger(name: "zotero:template-updated", template: TemplateType): void;
  }
}
