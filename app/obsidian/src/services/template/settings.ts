import { selectKeys } from "@mobily/ts-belt/Dict";
import { assertNever } from "assert-never";
import type { trimConfig } from "eta-prf";
import Settings from "@/settings/base";
import ZoteroPlugin from "@/zt-main";
import { Template, TemplateNames, type TplType } from "./eta/preset";

interface SettingOptions {
  folder: string;
  templates: Record<TplType.Embeded, string>;
  updateAnnotBlock: boolean;
  updateOverwrite: boolean;
  autoPairEta: boolean;
  autoTrim: [trimConfig, trimConfig];
}

type SettingOptionsJSON = Record<
  "template",
  Pick<SettingOptions, "folder" | "templates">
> &
  Omit<SettingOptions, "ejected" | "folder" | "templates">;

export class TemplateSettings extends Settings<SettingOptions> {
  plugin = this.use(ZoteroPlugin);
  getDefaults() {
    return {
      folder: "ZtTemplates",
      templates: Template.Embeded,
      autoPairEta: false,
      updateAnnotBlock: false,
      updateOverwrite: false,
      autoTrim: [false, false],
    } satisfies SettingOptions;
  }

  async setTemplate<K extends TplType.Embeded>(
    key: K,
    value: string,
  ): Promise<boolean> {
    if (this.templates[key] === value) return false;
    this.templates[key] = value;
    this.plugin.app.vault.trigger("zotero:template-updated", key);
    return true;
  }

  async apply(key: keyof SettingOptions): Promise<void> {
    const plugin = this.use(ZoteroPlugin);
    switch (key) {
      case "folder":
      case "templates":
      case "updateAnnotBlock":
      case "updateOverwrite":
        return;
      case "autoPairEta":
        return plugin.templateEditor.setEtaBracketPairing(this.autoPairEta);
      case "autoTrim":
        // this.eta.configure({ autoTrim: this.autoTrim });
        for (const type of TemplateNames.All) {
          this.plugin.app.vault.trigger("zotero:template-updated", type);
        }
        return;
      default:
        assertNever(key);
    }
  }
  async applyAll() {
    await this.apply("autoPairEta");
  }

  toJSON(): SettingOptionsJSON {
    return {
      template: {
        folder: this.folder,
        templates: this.templates,
      },
      autoPairEta: this.autoPairEta,
      updateAnnotBlock: this.updateAnnotBlock,
      updateOverwrite: this.updateOverwrite,
      autoTrim: this.autoTrim,
    };
  }
  // fix compatibility with old settings format
  fromJSON(json: SettingOptionsJSON): void {
    super.fromJSON({
      ...(json.template ?? {}),
      ...selectKeys(json, [
        "autoPairEta",
        "updateAnnotBlock",
        "updateOverwrite",
        "autoTrim",
      ]),
    });
  }
}
