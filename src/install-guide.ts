import { fileDialog } from "file-select-dialog";
import { statSync } from "fs";
import type { App } from "obsidian";
import { Modal, Notice } from "obsidian";
import os from "os";
import { join } from "path";

import { getConfigDirFunc, libName } from "./const";

const PLUGIN_ID = "obsidian-zotero-plugin";

const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

declare global {
  const app: App & { openWithDefaultApp(path: string): void };
}

const arch = os.arch(),
  platform = os.platform();

const showInstallGuide = () => {
  // if platform is supported
  if (PlatformSupported.some(([p, a]) => arch === a && platform === p)) {
    const LibPath = join(getConfigDirFunc(), libName);
    try {
      if (!statSync(LibPath).isFile()) {
        new Notice(
          `Path to database library occupied, please check the location manually: ${
            getConfigDirFunc() + "/" + libName
          }`,
          2e3,
        );
      }
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        // if library file does not exist
        new GoToDownloadModal().open();
      } else {
        new Notice(error.toString());
      }
    }
  } else {
    new Notice(
      `Your device (${arch}-${platform}) is not supported by obsidian-zotero-plugin`,
    );
  }
};
export default showInstallGuide;

const PlatformSupported = [
  ["darwin", "arm64"],
  ["darwin", "x64"],
  ["linux", "x64"],
  ["win32", "x64"],
  ["win32", "ia32"],
] as [platform: string, arch: string][];

const downloadLink = `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/better-sqlite3/${platform}-${arch}.zip?raw=true`;

class GoToDownloadModal extends Modal {
  reloadButton: HTMLButtonElement | null = null;
  selectButton: HTMLButtonElement | null = null;

  constructor() {
    super(app);
    this.modalEl.addClass("zt-install-guide");
  }
  onOpen() {
    this.contentEl.createEl("h1", { text: "Install better-sqlite3" });
    this.contentEl.createDiv({}, (div) => {
      div.appendText(
        "Obsidian Zotero Plugin requires node-sqlite3 to be installed. " +
          "Follow the instructions below to install it.",
      );
      div.createEl("ol", {}, (ol) => {
        ol.createEl("li", {}, (li) => {
          li.appendText("Download zip file from ");
          li.createEl("a", { href: downloadLink, text: "GitHub" });
          li.appendText(".");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Extract the zip file to get ");
          li.createEl("code", { text: libName });
          li.appendText(" file");
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Click the button to select ");
          li.createEl("code", { text: libName });
          this.selectButton = li.createEl(
            "button",
            { text: "Select" },
            (btn) => (btn.onclick = this.onSelectingFile.bind(this)),
          );
        });
        ol.createEl("li", {}, (li) => {
          li.appendText("Click the button to reload Obsidian Zotero Plugin: ");
          this.reloadButton = li.createEl(
            "button",
            { text: "Reload Plugin" },
            (btn) => {
              btn.disabled = true;
              btn.style.backgroundColor = colorDisabled;
              btn.onclick = this.onReloadPlugin.bind(this);
            },
          );
        });
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }

  async onSelectingFile() {
    const file = await fileDialog({
      multiple: false,
      accept: ".node",
      strict: true,
    });
    if (!file) return;
    await this.app.vault.adapter.writeBinary(
      app.vault.configDir + "/" + libName,
      await file.arrayBuffer(),
    );
    if (this.selectButton) {
      this.selectButton.setText("Library file imported");
      this.selectButton.style.backgroundColor = colorSuccess;
    }
    if (this.reloadButton) {
      this.reloadButton.disabled = false;
      this.reloadButton.style.backgroundColor = "";
    }
  }
  async onReloadPlugin() {
    await this.app.plugins.disablePlugin(PLUGIN_ID);
    this.close();
    await this.app.plugins.enablePlugin(PLUGIN_ID);
  }
}

export const checkLib = () => {
  try {
    require(join(getConfigDirFunc(), libName));
  } catch (err) {
    (err as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND" &&
      showInstallGuide();
    throw err;
  }
};
