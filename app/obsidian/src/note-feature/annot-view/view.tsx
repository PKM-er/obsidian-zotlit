import type { AnnotsViewContextType, AnnotsViewStore } from "@obzt/components";
import {
  ObsidianContext,
  AnnotsViewContext,
  AnnotsView,
} from "@obzt/components";
import { getCacheImagePath } from "@obzt/database";
import { assertNever } from "assert-never";
import type { WorkspaceLeaf } from "obsidian";
import ReactDOM from "react-dom";
import { context } from "../../components/context";
import { waitUntil } from "../../utils/once";
import { DatabaseStatus } from "../../zotero-db/connector/service";
import type ZoteroPlugin from "../../zt-main";
import { DerivedFileView } from "../derived-file-view";
import { getAnnotRenderer, getDragStartHandler } from "./drag-insert";
import { getMoreOptionsHandler } from "./more-options";
import type { StoreAPI } from "./store";
import { createStore } from "./store";
import "./style.less";

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
    this.contentEl.addClass("obzt");
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
    return waitUntil({
      unregister: (ref) => app.vault.offref(ref),
      escape: () => this.plugin.dbWorker.status === DatabaseStatus.Ready,
      register: (cb) => {
        const status = this.plugin.dbWorker.status;
        if (status === DatabaseStatus.NotInitialized) {
          return app.vault.on("zotero:db-ready", cb);
        } else if (status === DatabaseStatus.Pending) {
          return app.vault.on("zotero:db-refresh", cb);
        } else if (status === DatabaseStatus.Ready) {
          throw new Error("should not be called when db is ready");
        }
        assertNever(status);
      },
      onRegister: (ref) => this.registerEvent(ref),
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

  getContext(): AnnotsViewContextType<
    Pick<
      AnnotsViewStore,
      "doc" | "attachment" | "allAttachments" | "tags" | "annotations"
    >
  > {
    const plugin = this.plugin;
    return {
      store: this.store,
      registerDbUpdate(callback) {
        app.vault.on("zotero:db-refresh", callback);
        return () => app.vault.off("zotero:db-refresh", callback);
      },
      refreshConn: async () => {
        await this.plugin.dbWorker.refresh({ task: "dbConn" });
      },
      getImgSrc: (annotation) => {
        return `app://local${getCacheImagePath(
          annotation,
          plugin.settings.database.zoteroDataDir,
        )}`;
      },
      onShowDetails: (itemId) => {
        console.log("show details", itemId);
      },
      onDragStart: getDragStartHandler(plugin),
      onMoreOptions: getMoreOptionsHandler(this),
      annotRenderer: getAnnotRenderer(plugin),
    };
  }

  protected async onOpen() {
    await super.onOpen();
    await this.untilZoteroReady();
    ReactDOM.render(
      <ObsidianContext.Provider value={context}>
        <AnnotsViewContext.Provider value={this.getContext()}>
          <AnnotsView />
        </AnnotsViewContext.Provider>{" "}
      </ObsidianContext.Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}
