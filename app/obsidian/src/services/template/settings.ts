import type { Extension } from "@codemirror/state";
import { deleteKeys, keys, selectKeys } from "@mobily/ts-belt/Dict";
import { enumerate } from "@obzt/common";
import { assertNever } from "assert-never";
import type { getConfig } from "eta";
import annotation from "./defaults/zt-annot.ejs";
import annots from "./defaults/zt-annots.ejs";
import note from "./defaults/zt-note.ejs";
import { bracketExtension } from "./editor/bracket";
import type { FmBlackList, FmWhiteList } from "./frontmatter";
import { FMFIELD_MAPPING } from "./frontmatter";
import { TemplateLoader } from "./loader";
import Settings from "@/settings/base";
import ZoteroPlugin from "@/zt-main";

export type EjectableTemplate = "note" | "annotation" | "annots";
export type NonEjectableTemplate = "filename" | "citation" | "altCitation";
export type TemplateType = EjectableTemplate | NonEjectableTemplate;

/**
 * render undefined/null in interpolate tag as empty string
 */
const nullishAsEmptyString = {
  processAST: (buffer: (string | { t: "i" | "e" | "r"; val: string })[]) => {
    for (const b of buffer) {
      if (typeof b === "string") continue;
      if (b.t === "i" && b.val.startsWith("it.")) {
        // undefined/null is rendered as empty string in favor of 'undefined'
        b.val += '??""';
      }
    }
    return buffer;
  },
};

export const defaultEtaConfig = {
  autoEscape: false,
  plugins: [nullishAsEmptyString],
} satisfies Partial<ReturnType<typeof getConfig>>;

interface SettingOptions {
  ejected: boolean;
  folder: string;
  templates: Record<NonEjectableTemplate, string>;
  fmFields: FmWhiteList | FmBlackList;
  autoPairEta: boolean;
}

type SettingOptionsJSON = Record<
  "template",
  Pick<SettingOptions, "ejected" | "folder" | "templates">
> &
  Omit<SettingOptions, "ejected" | "folder" | "templates">;

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

export const ejectableTemplateTypes = keys(TEMPLATE_FILES),
  templateTypes = keys(DEFAULT_TEMPLATE),
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
      templates: deleteKeys(DEFAULT_TEMPLATE, ejectableTemplateTypes),
      fmFields: {
        mode: "whitelist",
        mapping: {
          ...FMFIELD_MAPPING,
        },
      } satisfies FmWhiteList,
      autoPairEta: false,
    } satisfies SettingOptions;
  }

  async setTemplate<K extends NonEjectableTemplate>(
    key: K,
    value: string,
  ): Promise<boolean> {
    if (this.templates[key] === value) return false;
    this.templates[key] = value;
    app.vault.trigger("zotero:template-updated", key);
    return true;
  }

  /** null if not registered */
  #editorExtensions: Extension[] | null = null;

  async apply(key: keyof SettingOptions): Promise<void> {
    const loader = this.use(TemplateLoader),
      plugin = this.use(ZoteroPlugin);
    switch (key) {
      case "ejected":
        return await loader.loadTemplates("eject");
      case "folder":
        // fully reload
        return await loader.loadTemplates("full");
      case "templates":
        return await loader.loadTemplates("noneject");
      case "fmFields":
        return;
      case "autoPairEta": {
        const loadedBefore = this.#editorExtensions !== null;
        if (this.#editorExtensions === null) {
          this.#editorExtensions = [];
          plugin.registerEditorExtension(this.#editorExtensions);
        } else {
          this.#editorExtensions.length = 0;
        }
        if (this.autoPairEta) {
          this.#editorExtensions.push(bracketExtension);
        }
        if (loadedBefore) {
          app.workspace.updateOptions();
        }
        break;
      }
      default:
        assertNever(key);
    }
  }
  async applyAll() {
    const loader = this.use(TemplateLoader);
    return await loader.loadTemplates("full");
  }

  toJSON(): SettingOptionsJSON {
    return {
      template: {
        ejected: this.ejected,
        folder: this.folder,
        templates: this.templates,
      },
      fmFields: this.fmFields,
      autoPairEta: this.autoPairEta,
    };
  }
  // fix compatibility with old settings format
  fromJSON(json: SettingOptionsJSON): void {
    super.fromJSON({
      ...(json.template ?? {}),
      ...selectKeys(json, ["autoPairEta", "fmFields"]),
    });
  }
}
