import "./main.less";

import { Plugin } from "obsidian";

import getZoteroLinkHandlers from "./link-handler";
import { ZoteroSettingTab } from "./setting-tab";
import {
  getDefaultSettings,
  loadSettings,
  saveSettings,
  ZoteroSettings,
} from "./settings";
import ZoteroDb from "./zotero-db";

export default class ZoteroPlugin extends Plugin {
  settings: ZoteroSettings = getDefaultSettings();
  loadSettings = loadSettings.bind(this);
  saveSettings = saveSettings.bind(this);

  db = new ZoteroDb(this);

  async onload() {
    console.log("loading Obsidian Zotero Plugin");

    await this.loadSettings();

    getZoteroLinkHandlers(this).forEach((args) =>
      this.registerObsidianProtocolHandler(...args),
    );

    this.db.open();

    this.addSettingTab(new ZoteroSettingTab(this));
  }

  onunload() {
    console.log("unloading Obsidian Zotero Plugin");
    this.db.close();
  }
}
