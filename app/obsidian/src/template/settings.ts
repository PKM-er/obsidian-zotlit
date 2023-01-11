import { D } from "@mobily/ts-belt";
import { enumerate } from "@obzt/common";
import { assertNever } from "assert-never";
import Settings from "../zotero-db/settings-base";
import annotation from "./defaults/zt-annot.ejs";
import annots from "./defaults/zt-annots.ejs";
import note from "./defaults/zt-note.ejs";
import { TemplateLoader } from "./loader";

export type EjectableTemplate = "note" | "annotation" | "annots";
export type NonEjectableTemplate = "filename" | "citation" | "altCitation";
export type TemplateType = EjectableTemplate | NonEjectableTemplate;

interface SettingOptions {
  ejected: boolean;
  folder: string;
  templates: Record<NonEjectableTemplate, string>;
}

export const DEFAULT_TEMPLATE: Record<TemplateType, string> = {
  note,
  annots,
  annotation,
  filename:
    "<%= it.citekey ?? it.DOI ?? it.title ?? it.key ?? it.citekey %>.md",
  citation: "[@<%= it.citekey %>]",
  altCitation: "@<%= it.citekey %>",
};

export const TEMPLATE_FILES: Record<EjectableTemplate, string> = {
  note: "zt-note.eta.md",
  annotation: "zt-annot.eta.md",
  annots: "zt-annots.eta.md",
};

export const FILE_TEMPLATE_MAP: Record<string, EjectableTemplate> =
  Object.fromEntries(Object.entries(TEMPLATE_FILES).map((kv) => kv.reverse()));

export const ejectableTemplateTypes = D.keys(TEMPLATE_FILES),
  templateTypes = D.keys(DEFAULT_TEMPLATE),
  nonEjectableTemplateTypes = enumerate<NonEjectableTemplate>()(
    "filename",
    "citation",
    "altCitation",
  );

export class TemplateSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      ejected: false,
      folder: "ZtTemplates",
      templates: D.deleteKeys(DEFAULT_TEMPLATE, ejectableTemplateTypes),
    };
  }

  async setTemplate<K extends NonEjectableTemplate>(
    key: K,
    value: string,
  ): Promise<void> {
    if (this.templates[key] === value) return;
    this.templates[key] = value;
    app.vault.trigger("zotero:template-updated", key);
  }

  async setOption<K extends keyof SettingOptions>(
    key: K,
    value: SettingOptions[K],
  ): Promise<void> {
    if (key === "templates") {
      throw new Error(`Cannot set templates directly. Use setTemplate`);
    }
    await super.setOption(key, value);
    const loader = this.use(TemplateLoader);
    switch (key) {
      case "ejected":
        await loader.loadTemplates("eject");
        break;
      case "folder":
        // fully reload
        await loader.loadTemplates("full");
        break;
      default:
        assertNever(key);
    }
  }
}
