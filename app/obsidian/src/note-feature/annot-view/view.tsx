import { atom, Provider } from "jotai";
import { createNanoEvents } from "nanoevents";
import type { TFile, WorkspaceLeaf } from "obsidian";
import ReactDOM from "react-dom";
import { pluginAtom } from "@component/atoms/obsidian";
import { GLOBAL_SCOPE } from "@component/atoms/utils";
import { createInitialValues } from "@utils/create-initial";
import { DatabaseStatus } from "../../zotero-db/connector/service";
import type ZoteroPlugin from "../../zt-main";
import { AnnotView } from "./annot-view";
import { DerivedFileView } from "./derived-file-view";

export const annotViewType = "zotero-annotation-view";

interface Events {
  "load-file": (file: TFile) => void;
}

export const annotViewAtom = atom<AnnotationView>(null as never);

export class AnnotationView extends DerivedFileView {
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

  emitter = createNanoEvents<Events>();

  on<E extends keyof Events>(event: E, callback: Events[E]) {
    return this.emitter.on(event, callback);
  }

  update() {
    this.emitter.emit("load-file", this.file);
  }
  canAcceptExtension(_extension: string): boolean {
    // accept all extensions
    // otherwise the leaf will be re-opened with linked file
    // whenever the linked file changes
    // (default syncstate behavior for grouped leaves)
    return true;
  }

  protected async onOpen() {
    await super.onOpen();
    const initVals = createInitialValues();
    initVals.set(pluginAtom, this.plugin);
    initVals.set(annotViewAtom, this);
    await new Promise<void>((resolve) => {
      if (this.plugin.dbWorker.status !== DatabaseStatus.Ready) {
        const ref = app.vault.on("zotero:db-ready", () => {
          app.vault.offref(ref);
          resolve();
        });
        this.registerEvent(ref);
      } else {
        resolve();
      }
    });

    ReactDOM.render(
      <Provider initialValues={initVals.get()} scope={GLOBAL_SCOPE}>
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
