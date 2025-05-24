import "core-js/proposals/explicit-resource-management";

import { Plugin } from "obsidian";
import ZotlitSettings from "./settings/registry";
import { ZotlitSettingTab } from "./settings/tab";

export default class ZotLit extends Plugin {
  settings = new ZotlitSettings(this);
  async onload() {
    console.log("loading zotlit");
    await this.settings.loadSettings();
    this.addSettingTab(new ZotlitSettingTab(this.app, this));
  }
}
