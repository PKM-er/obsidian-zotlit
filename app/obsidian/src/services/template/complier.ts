import { Service } from "@ophidian/core";
import shimArrayGroup from "array.prototype.group/shim";
import { Notice, parseYaml } from "obsidian";
import log, { logError } from "@/log";
import { extractFrontmatter } from "./get-fm";
import type { AnnotHelper } from "./helper";
import { TemplateLoader } from "./loader";
import type { TemplateType } from "./settings";
import { TemplateSettings } from "./settings";
import { acceptLineBreak, renderFilename } from "./utils";

// const calloutPattern = /^\s*\[!\w+\]/;

export class TemplateComplier extends Service {
  loader = this.use(TemplateLoader);

  eta = this.use(TemplateSettings).eta;

  async onload() {
    this.registerEvent(
      app.vault.on("zotero:template-updated", this.onTemplateUpdated, this),
    );
  }

  onTemplateUpdated(template: TemplateType) {
    this.complie(template);
  }

  complie(name: TemplateType) {
    const template = this.loader.getTemplate(name);
    const converted = acceptLineBreak(template);
    try {
      const compiled = this.eta.compile(converted);

      let full = compiled;
      switch (name) {
        case "filename":
          full = function (data, opts) {
            return renderFilename(compiled.call(this, data, opts));
          };
          break;
        case "annotation":
          full = function (data, opts) {
            const result = compiled.call(this, data, opts);
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
            // console.log(lines[0], calloutPattern.test(lines[0]));
            // no longer add callout when missing in case that
            // label added in annotations template
            // if (!calloutPattern.test(lines[0])) {
            //   lines.unshift(`[!NOTE]`);
            // }
            lines.push(`^${(data as AnnotHelper).blockID}`);
            return lines.map((v) => `> ${v}`).join("\n");
          };
          break;
        default:
          break;
      }
      // polyfill Array.prototype.group
      // @ts-expect-error group not yet available
      const patched: typeof full = Array.prototype.group
        ? full
        : function (data, opts) {
            shimArrayGroup();
            try {
              const output = full.call(this, data, opts);
              return output;
            } finally {
              // @ts-expect-error group not yet available
              delete Array.prototype.group;
            }
          };
      this.eta.templatesSync.define(name, patched);
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
