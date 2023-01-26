import "./style.css";

import { Plugin } from "@aidenlx/zotero-helper/zotero";

export default class ZoteroPlugin extends Plugin {
  onInstall(): void | Promise<void> {
    this.app.log("Hello, world! Installed");
  }
  onUninstall(): void | Promise<void> {
    this.app.log("Hello, world! Uninstalled");
  }
  onload(): void {
    this.app.log("Hello, world! Loaded");
  }
  onunload(): void {
    this.app.log("Hello, world! unloaded");
  }
}
