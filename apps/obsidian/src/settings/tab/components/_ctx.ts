import type { SettingAccessor } from "@/settings/registry/accessor";

export type SettingsContext = {
  containerEl: HTMLElement;
  settings: SettingAccessor;
};
