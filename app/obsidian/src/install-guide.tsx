/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */

import { statSync } from "fs";
import { join } from "path";
import { constants } from "@obzt/common";
import { fileDialog } from "file-select-dialog";
import type { FileSystemAdapter } from "obsidian";
import { Modal, Notice } from "obsidian";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import log from "@log";

// #region check if compatible lib exists

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

const getConfigDirFunc = () =>
  (app.vault.adapter as FileSystemAdapter).getFullPath(app.vault.configDir);

const checkLib = () => {
  const libPath = join(getConfigDirFunc(), constants.libName);
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
// #endregion

// #region Install Guide Modal
const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

declare module "obsidian" {
  interface App {
    openWithDefaultApp(path: string): void;
  }
}
const PLUGIN_ID = "obsidian-zotero-plugin";

class GoToDownloadModal extends Modal {
  constructor() {
    super(app);
    this.modalEl.addClass("zt-install-guide");
  }
  root = createRoot(this.contentEl);
  onOpen() {
    this.root.render(
      <GuideContent reloadPlugin={this.reloadPlugin.bind(this)} />,
    );
  }
  onClose() {
    this.root.unmount();
  }

  async reloadPlugin() {
    await app.plugins.disablePlugin(PLUGIN_ID);
    this.close();
    await app.plugins.enablePlugin(PLUGIN_ID);
  }
}

const importModule = async (): Promise<boolean> => {
  const file = await fileDialog({
    multiple: false,
    accept: ".node",
    strict: true,
  });
  if (!file) return false;
  try {
    await app.vault.adapter.writeBinary(
      app.vault.configDir + "/" + constants.libName,
      await file.arrayBuffer(),
    );
    return true;
  } catch (error) {
    new Notice(
      `failed to write ${constants.libName}, check console for details`,
    );
    log.error(`failed to write ${constants.libName}`, error);
    return false;
  }
};

const GuideContent = ({
  reloadPlugin,
}: {
  reloadPlugin: () => Promise<void>;
}) => {
  const downloadLink = `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/better-sqlite3/${platform}-${arch}-${modules}.zip?raw=true`,
    moduleFilename = <code>{constants.libName}</code>;

  const [fileImported, setFileImported] = useState(false);

  const onSelectFileClicked = async () => {
    const result = await importModule();
    if (result) setFileImported(true);
  };

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
          Click the button to select {moduleFilename}:
          <SelectButton onClick={onSelectFileClicked} done={fileImported} />
        </li>
        <li>
          Click the button to reload Obsidian Zotero Plugin:
          <ReloadButton onClick={reloadPlugin} disabled={!fileImported} />
        </li>
      </ol>
    </div>
  );
};

const SelectButton = ({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => any;
}) => {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: done ? colorSuccess : undefined }}
    >
      {!done ? "Select" : "Library file imported"}
    </button>
  );
};

const ReloadButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => any;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ backgroundColor: disabled ? colorDisabled : undefined }}
    >
      Reload Plugin
    </button>
  );
};

// #endregion
