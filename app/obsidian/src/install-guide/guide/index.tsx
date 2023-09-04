import { Provider } from "jotai";
import type { App, PluginManifest } from "obsidian";
import { Modal } from "obsidian";
import ReactDOM from "react-dom";
import { createInitialValues } from "@/utils/create-initial";
import type { PlatformDetails } from "../version";
import type { GuideMode } from "./atom";
import { modalAtom } from "./atom";
import { InstallGuide } from "./content";

export class InstallGuideModal extends Modal {
  constructor(
    public manifest: PluginManifest,
    public platform: PlatformDetails,
    public binaryVersion: string,
    public mode: GuideMode,
    public app: App,
  ) {
    super(app);
    this.titleEl.setText("Setup ZotLit");
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
    await this.app.plugins.disablePlugin(this.manifest.id);
    this.close();
    await this.app.plugins.enablePlugin(this.manifest.id);
  }
}
