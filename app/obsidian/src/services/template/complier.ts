import { Service } from "@ophidian/core";
import * as Eta from "eta";
import { Notice, parseYaml } from "obsidian";
import log, { logError } from "@/log";
import { extractFrontmatter } from "./get-fm";
import type { AnnotHelper } from "./helper";
import { TemplateLoader } from "./loader";
import type { TemplateType } from "./settings";
import { defaultEtaConfig } from "./settings";
import { acceptLineBreak, renderFilename } from "./utils";

const calloutPattern = /^\s*\[!\w+\]/;

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
      let full = compiled;
      switch (name) {
        case "filename":
          full = (data, opts) => renderFilename(compiled(data, opts));
          break;
        case "annotation":
          full = (data, opts) => {
            const result = compiled(data, opts);
            let warpCallout = true;
            const { yaml, body } = extractFrontmatter(result);
            if (yaml) {
              try {
                if (parseYaml(yaml).callout === false) warpCallout = false;
              } catch (error) {
                new Notice(`Error parsing frontmatter, ${error}`);
              }
            }
            if (!warpCallout) return body;
            const lines = body.trim().split("\n");
            console.log(lines[0], calloutPattern.test(lines[0]));
            if (!calloutPattern.test(lines[0])) {
              lines.unshift(`[!NOTE]`);
            }
            lines.push(`^${(data as AnnotHelper).blockID}`);
            return lines.map((v) => `> ${v}`).join("\n");
          };
          break;
        default:
          break;
      }
      Eta.templates.define(name, full);
      log.trace(`Template "${name}" complie success`, converted);
    } catch (error) {
      logError("compling template: " + name, error);
      new Notice(`Error compling template "${name}", ${error}`);
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
