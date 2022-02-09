import "./main.less";

import { normalizePath, Plugin } from "obsidian";

import { DEFAULT_SETTINGS, ZoteroSettings, ZoteroSettingTab } from "./settings";
import ZoteroDb from "./zotero-db";

export default class ZoteroPlugin extends Plugin {
  settings: ZoteroSettings = DEFAULT_SETTINGS;
  db = new ZoteroDb(this);

  async onload() {
    console.log("loading Obsidian Zotero Plugin");

    await this.loadSettings();

    this.db.open();

    this.addSettingTab(new ZoteroSettingTab(this));
  }

  onunload() {
    // console.log("unloading Obsidian Zotero Plugin");
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
