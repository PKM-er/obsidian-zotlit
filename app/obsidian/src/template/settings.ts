import { D } from "@mobily/ts-belt";
import { enumerate } from "@obzt/common";
import { assertNever } from "assert-never";
import Settings from "../zotero-db/settings-base";
import annotation from "./defaults/zt-annot.ejs";
import annots from "./defaults/zt-annots.ejs";
import note from "./defaults/zt-note.ejs";
import type { FmBlackList, FmWhiteList } from "./frontmatter";
import { FMFIELD_MAPPING } from "./frontmatter";
import { TemplateLoader } from "./loader";

export type EjectableTemplate = "note" | "annotation" | "annots";
export type NonEjectableTemplate = "filename" | "citation" | "altCitation";
export type TemplateType = EjectableTemplate | NonEjectableTemplate;

interface SettingOptions {
  ejected: boolean;
  folder: string;
  templates: Record<NonEjectableTemplate, string>;
  fields: FmWhiteList | FmBlackList;
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
      fields: {
        mode: "whitelist",
        mapping: {
          ...FMFIELD_MAPPING,
        },
      } satisfies FmWhiteList,
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

  async apply(key: keyof SettingOptions): Promise<void> {
    const loader = this.use(TemplateLoader);
    switch (key) {
      case "ejected":
        return await loader.loadTemplates("eject");
      case "folder":
        // fully reload
        return await loader.loadTemplates("full");
      case "templates":
        return await loader.loadTemplates("noneject");
      case "fields":
        return;
      default:
        assertNever(key);
    }
  }
  async applyAll() {
    const loader = this.use(TemplateLoader);
    return await loader.loadTemplates("full");
  }
}
