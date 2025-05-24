import "core-js/proposals/explicit-resource-management";

import { Plugin } from "obsidian";
import ZotlitSettings from "./settings/registry";
import { ZotlitSettingTab } from "./settings/tab";
import { Database } from "./database";

export default class ZotLit extends Plugin {
  settings = new ZotlitSettings(this);
  database = new Database(this);
  async onload() {
    console.log("loading zotlit");
    await this.settings.loadSettings();
    this.addSettingTab(new ZotlitSettingTab(this.app, this));
    await this.database.init();
    console.log("zotlit loaded");
  }
}
