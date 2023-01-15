import { Hello } from "@obzt/components";
import type { WorkspaceLeaf } from "obsidian";
import { useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import { useStore } from "zustand";
import { AnnotsView, Obsidian, createStore } from "../../component";
import type { StoreAPI } from "../../component/store";
import { DatabaseStatus } from "../../zotero-db/connector/service";
import type ZoteroPlugin from "../../zt-main";
import { DerivedFileView } from "./derived-file-view";

export const annotViewType = "zotero-annotation-view";

// interface Events {
//   "load-file": (file: string | null) => void;
//   "load-doc-item": (item: RegularItemInfo, sourcePath: string) => void;
//   "load-doc-tags": (tags: number[]) => void;
//   "load-attachments": (attachments: AttachmentInfo[]) => void;
//   "load-annotations": (annotations: AnnotationInfo[]) => void;
//   "load-annot-tags": (tags: Map<number, number[]>) => void;
// }

export class AnnotationView extends DerivedFileView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.store = createStore(plugin);
  }
  // root = createRoot(this.contentEl);

  public getViewType(): string {
    return annotViewType;
  }

  onload(): void {
    super.onload();
    this.registerEvent(
      app.metadataCache.on("zotero:index-update", this.loadDocItem),
    );
    this.registerEvent(
      app.metadataCache.on("zotero:index-clear", this.loadDocItem),
    );
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

  loadDocItem = () => {
    this.store.getState().loadDocItem(this.getFile(), this.lib);
  };

  // emitter = createNanoEvents<Events>();

  // on<E extends keyof Events>(event: E, callback: Events[E]) {
  //   return this.emitter.on(event, callback);
  // }

  update() {
    // const file = this.getFile();
    this.untilZoteroReady().then(this.loadDocItem);
    // this.emitter.emit("load-file", file?.path);
  }
  canAcceptExtension(_extension: string): boolean {
    // accept all extensions
    // otherwise the leaf will be re-opened with linked file
    // whenever the linked file changes
    // (default syncstate behavior for grouped leaves)
    return true;
  }

  untilZoteroReady() {
    return new Promise<void>((resolve) => {
      const status = this.plugin.dbWorker.status;
      if (status === DatabaseStatus.Ready) {
        resolve();
      } else if (status === DatabaseStatus.NotInitialized) {
        const ref = app.vault.on("zotero:db-ready", () => {
          app.vault.offref(ref);
          resolve();
        });
        this.registerEvent(ref);
      } else if (status === DatabaseStatus.Pending) {
        const ref = app.vault.on("zotero:db-refresh", () => {
          app.vault.offref(ref);
          resolve();
        });
        this.registerEvent(ref);
      }
    });
  }

  get lib() {
    return this.plugin.settings.database.citationLibrary;
  }
  /** @returns null if current file not literature note */
  getFile() {
    let itemKey;
    if (
      this.file?.extension === "md" &&
      (itemKey = this.plugin.noteIndex.getItemKeyOf(this.file))
    ) {
      return { path: this.file.path, itemKey };
    }
    return null;
  }

  store: StoreAPI;

  protected async onOpen() {
    await super.onOpen();
    await this.untilZoteroReady();
    ReactDOM.render(
      <Obsidian.Provider value={{ plugin: this.plugin, view: this }}>
        <Hello />;
      </Obsidian.Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}

const useOnDbRefresh = () => {
  const { view } = useContext(Obsidian);
  const refresh = useStore(view.store, (s) => s.refresh);
  useEffect(() => {
    const ref = app.vault.on("zotero:db-refresh", refresh);
    return () => app.vault.offref(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

function Component() {
  const { view } = useContext(Obsidian);

  useOnDbRefresh();
  const empty = useStore(view.store, (s) => !s.doc);

  if (empty) {
    return (
      <div className="annot-view">
        <div className="pane-empty">Active file not literature note</div>
      </div>
    );
  }

  return <AnnotsView />;
}
