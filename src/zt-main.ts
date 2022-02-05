import "./main.less";

import { Plugin } from "obsidian";

import {
  ZoteroSettings,
  ZoteroSettingTab,
  DEFAULT_SETTINGS,
} from "./settings";

export default class Zotero extends Plugin {
  settings: ZoteroSettings = DEFAULT_SETTINGS;

  async onload() {
    console.log("loading Obsidian Zotero");

    await this.loadSettings();

    this.addSettingTab(new ZoteroSettingTab(this));
  }

  onunload() {
    // console.log("unloading Obsidian Zotero");
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
