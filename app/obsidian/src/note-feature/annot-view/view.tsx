import { Provider } from "jotai";
import type { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import ReactDOM from "react-dom";
import { pluginAtom } from "@component/atoms/obsidian";
import { createInitialValues } from "@component/atoms/utils";
import type ZoteroPlugin from "../../zt-main";
import { AnnotView } from "./annot-view";

export const annotViewType = "zotero-annotation-view";

export class AnnotationView extends ItemView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
  }
  // root = createRoot(this.contentEl);

  public getViewType(): string {
    return annotViewType;
  }

  public getDisplayText(): string {
    const activeDoc = this.plugin.app.workspace.getActiveFile();
    let suffix = "";
    if (activeDoc?.extension === "md") suffix = ` for ${activeDoc.basename}`;
    return "Zotero Annotations" + suffix;
  }

  public getIcon(): string {
    return "highlighter";
  }

  protected async onOpen() {
    await super.onOpen();
    const initVals = createInitialValues();
    initVals.set(pluginAtom, this.plugin);
    ReactDOM.render(
      <Provider initialValues={initVals.get()}>
        <AnnotView />
      </Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}
