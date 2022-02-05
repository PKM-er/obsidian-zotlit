import { PluginSettingTab, Setting } from "obsidian";

import Zotero from "./zt-main";

export interface ZoteroSettings {}

export const DEFAULT_SETTINGS: ZoteroSettings = {};

export class ZoteroSettingTab extends PluginSettingTab {

  constructor(public plugin: Zotero) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
  }
}
