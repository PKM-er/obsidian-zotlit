/** @jsx el */

import { fileDialog } from "file-select-dialog";
import { statSync } from "fs";
import { Modal, Notice } from "obsidian";
import { join } from "path";

//#region check if compatible lib exists

const {
  arch,
  platform,
  versions: { modules, electron },
} = process;

type ModuleVersions = typeof moduleVersions[number];
const moduleVersions = ["103"] as const;
const PlatformSupported = {
  "103": {
    darwin: ["arm64", "x64"],
    linux: ["x64"],
    win32: ["x64", "ia32"],
  },
} as {
  [moduleVersion in ModuleVersions]: {
    [platform: string]: string[];
  };
};
const showInstallGuide = (libPath: string) => {
  if (!modules || !moduleVersions.includes(modules as any)) {
    new Notice(
      `The electron (electron: ${electron}, module version: ${modules}) ` +
        `in current version of obsidian is not supported by obsidian-zotero-plugin,` +
        ` please reinstall using latest obsidian installer from official website`,
    );
  }
  if (
    PlatformSupported[modules as ModuleVersions]?.[platform]?.includes(arch)
  ) {
    // if platform is supported
    try {
      if (!statSync(libPath).isFile()) {
        new Notice(
          `Path to database library occupied, please check the location manually: ` +
            libPath,
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

import { getConfigDirFunc, libName } from "../const.mjs";

const checkLib = () => {
  const libPath = join(getConfigDirFunc(), libName);
  try {
    require(libPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "MODULE_NOT_FOUND") {
      showInstallGuide(libPath);
    }
    throw err;
  }
};
export default checkLib;
//#endregion

//#region Install Guide Modal
import { el, mount, unmount } from "redom";
declare global {
  namespace JSX {
    export interface IntrinsicElements {
      [elemName: string]: any;
    }
    // export type ElementClass = RedomComponent;
    //export type Element = RedomElement | HTMLElement
  }
}
const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";
const getGuideContent = ({
  selectBtn,
  reloadBtn,
}: {
  selectBtn: HTMLButtonElement;
  reloadBtn: HTMLButtonElement;
}): HTMLElement => {
  const downloadLink = `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/better-sqlite3/${platform}-${arch}-${modules}.zip?raw=true`,
    moduleFilename = <code>{libName}</code>;
  return (
    <div>
      <h1>Install better-sqlite3</h1>
      <div>
        Obsidian Zotero Plugin requires better-sqlite3 to be installed. Follow
        the instructions below to install it.
      </div>
      <ol>
        <li>
          Download zip file from <a href={downloadLink}>GitHub</a>.
        </li>
        <li>Extract the zip file to get {moduleFilename} file</li>
        <li>
          Click the button to select {moduleFilename}: {selectBtn}
        </li>
        <li>Click the button to reload Obsidian Zotero Plugin: {reloadBtn}</li>
      </ol>
    </div>
  );
};

declare module "obsidian" {
  interface App {
    openWithDefaultApp(path: string): void;
  }
}
const PLUGIN_ID = "obsidian-zotero-plugin";

class GoToDownloadModal extends Modal {
  selectBtn: HTMLButtonElement;
  reloadBtn: HTMLButtonElement;
  jsx: HTMLElement;

  constructor() {
    super(app);
    this.modalEl.addClass("zt-install-guide");
    this.selectBtn = (
      <button onclick={this.onSelectingFile.bind(this)}>Select</button>
    );
    this.reloadBtn = (
      <button disabled onclick={this.onReloadPlugin.bind(this)}>
        Reload Plugin
      </button>
    );
    this.reloadBtn.style.backgroundColor = colorDisabled;
    this.jsx = getGuideContent(this);
  }
  onOpen() {
    mount(this.contentEl, this.jsx);
  }
  onClose() {
    unmount(this.contentEl, this.jsx);
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
      this.app.vault.configDir + "/" + libName,
      await file.arrayBuffer(),
    );
    if (this.selectBtn) {
      this.selectBtn.setText("Library file imported");
      this.selectBtn.style.backgroundColor = colorSuccess;
    }
    if (this.reloadBtn) {
      this.reloadBtn.disabled = false;
      this.reloadBtn.style.backgroundColor = "";
    }
  }
  async onReloadPlugin() {
    await this.app.plugins.disablePlugin(PLUGIN_ID);
    this.close();
    await this.app.plugins.enablePlugin(PLUGIN_ID);
  }
}
//#endregion
