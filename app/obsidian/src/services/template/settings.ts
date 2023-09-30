import type { trimConfig } from "eta-prf";
import { Template, type TplType } from "./eta/preset";

export interface SettingsTemplate {
  template: { folder: string; templates: Record<TplType.Embeded, string> };
  updateAnnotBlock: boolean;
  updateOverwrite: boolean;
  autoPairEta: boolean;
  autoTrim: [trimConfig, trimConfig];
}

export const defaultSettingsTemplate: SettingsTemplate = {
  template: { folder: "ZtTemplates", templates: Template.Embeded },
  updateAnnotBlock: false,
  updateOverwrite: false,
  autoPairEta: false,
  autoTrim: [false, false],
};
