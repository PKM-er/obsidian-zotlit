import { Provider } from "jotai";
import type { PluginManifest } from "obsidian";
import { Modal } from "obsidian";
import ReactDOM from "react-dom";
import type { PlatformDetails } from "../version";
import type { GuideMode } from "./atom";
import { modalAtom } from "./atom";
import { InstallGuide } from "./content";
import { createInitialValues } from "@/utils/create-initial";

declare module "obsidian" {
  interface App {
    openWithDefaultApp(path: string): void;
  }
}

export class InstallGuideModal extends Modal {
  constructor(
    public manifest: PluginManifest,
    public platform: PlatformDetails,
    public binaryVersion: string,
    public mode: GuideMode,
  ) {
    super(app);
    this.titleEl.setText("Setup Obsidian Zotero Plugin");
    this.modalEl.addClass("mod-zt-install-guide");
  }

  // root = createRoot(this.contentEl);
  onOpen() {
    const init = createInitialValues();
    init.set(modalAtom, this);
    ReactDOM.render(
      <Provider initialValues={init.get()}>
        <InstallGuide />
      </Provider>,
      this.contentEl,
    );
  }
  onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
  }

  async reloadPlugin() {
    await app.plugins.disablePlugin(this.manifest.id);
    this.close();
    await app.plugins.enablePlugin(this.manifest.id);
  }
}
