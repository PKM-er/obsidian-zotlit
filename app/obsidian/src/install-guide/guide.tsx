import { constants } from "@obzt/common";
import { fileDialog } from "file-select-dialog";
import type { PluginManifest } from "obsidian";
import { Notice, Modal } from "obsidian";
import { useState } from "react";
import ReactDOM from "react-dom";
import log from "../logger";
import type { PlatformDetails } from "./version";

// #region Install Guide Modal
const colorSuccess = "var(--background-modifier-success)",
  colorDisabled = "var(--background-modifier-cover)";

declare module "obsidian" {
  interface App {
    openWithDefaultApp(path: string): void;
  }
}

export class GoToDownloadModal extends Modal {
  pluginId: string;
  constructor(menifest: PluginManifest, private platform: PlatformDetails) {
    super(app);
    this.pluginId = menifest.id;
    this.modalEl.addClass("zt-install-guide");
  }

  get downloadLink() {
    const { arch, platform, modules } = this.platform;
    return `https://github.com/aidenlx/obsidian-zotero-plugin/blob/master/assets/better-sqlite3/${platform}-${arch}-${modules}.zip?raw=true`;
  }
  // root = createRoot(this.contentEl);
  onOpen() {
    ReactDOM.render(
      <GuideContent
        reloadPlugin={this.reloadPlugin.bind(this)}
        downloadLink={this.downloadLink}
      />,
      this.contentEl,
    );
  }
  onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
  }

  async reloadPlugin() {
    await app.plugins.disablePlugin(this.pluginId);
    this.close();
    await app.plugins.enablePlugin(this.pluginId);
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
  downloadLink,
}: {
  reloadPlugin: () => Promise<void>;
  downloadLink: string;
}) => {
  const moduleFilename = <code>{constants.libName}</code>;

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
  onClick: () => void;
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
  onClick: () => void;
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
