import type {
  AnnotationInfo,
  AttachmentInfo,
  RegularItemInfo,
} from "@obzt/database";
import { createNanoEvents } from "nanoevents";
import type { WorkspaceLeaf } from "obsidian";
import { useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import { useStore } from "zustand";
import { AnnotsView, Obsidian, createStore } from "../../component";
import { DatabaseStatus } from "../../zotero-db/connector/service";
import type ZoteroPlugin from "../../zt-main";
import { DerivedFileView } from "./derived-file-view";

export const annotViewType = "zotero-annotation-view";

interface Events {
  "load-file": (file: string | null) => void;
  "load-doc-item": (item: RegularItemInfo, sourcePath: string) => void;
  "load-doc-tags": (tags: number[]) => void;
  "load-attachments": (attachments: AttachmentInfo[]) => void;
  "load-annotations": (annotations: AnnotationInfo[]) => void;
  "load-annot-tags": (tags: Map<number, number[]>) => void;
}

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
    const file = this.getFile();
    this.store.getState().loadDocItem(file, this.lib);
    this.emitter.emit("load-file", file);
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
  }

  get lib() {
    return this.plugin.settings.database.citationLibrary;
  }
  /** @returns null if current file not literature note */
  getFile() {
    if (
      this.file?.extension === "md" &&
      this.plugin.noteIndex.isLiteratureNote(this.file)
    ) {
      return this.file.path;
    }
    return null;
  }

  store = createStore(this.plugin.databaseAPI);

  protected async onOpen() {
    await super.onOpen();
    await this.untilZoteroReady();
    ReactDOM.render(
      <Obsidian.Provider value={{ plugin: this.plugin, view: this }}>
        <Component />
      </Obsidian.Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}

const useRefresh = () => {
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

  useRefresh();
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
