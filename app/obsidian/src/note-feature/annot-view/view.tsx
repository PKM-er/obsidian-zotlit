import "./style.less";

import type { ObsidianContext } from "@obzt/components";
import { ObsidianCtx, AnnotsView } from "@obzt/components";
import type { WorkspaceLeaf } from "obsidian";
import { setIcon } from "obsidian";
import ReactDOM from "react-dom";
import { withAnnotHelper, withDocItemHelper } from "../../template/helper";
import { DatabaseStatus } from "../../zotero-db/connector/service";
import type ZoteroPlugin from "../../zt-main";
import { DerivedFileView } from "./derived-file-view";
import { getDragStartHandler } from "./drag-insert";
import { itemDetailsProps } from "./item-details";
import { getMoreOptionsHandler } from "./more-options";
import type { StoreAPI } from "./store";
import { createStore } from "./store";

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

  getContext(): ObsidianContext {
    const plugin = this.plugin;
    return {
      sanitize: DOMPurify.sanitize.bind(DOMPurify),
      setIcon,
      store: this.store,
      registerCssChange(callback) {
        app.workspace.on("css-change", callback);
        return () => app.workspace.off("css-change", callback);
      },
      registerDbUpdate(callback) {
        app.vault.on("zotero:db-refresh", callback);
        return () => app.vault.off("zotero:db-refresh", callback);
      },
      refreshConn: async () => {
        await this.plugin.dbWorker.refresh({ task: "dbConn" });
      },
      getZoteroDataDir: () => this.plugin.settings.database.zoteroDataDir,
      buildAnnotHelper: (annotation, tags, attachment, sourcePath) =>
        withAnnotHelper(
          annotation,
          { tags, attachment },
          { plugin, sourcePath },
        ),
      buildDocItemHelper: (
        item,
        tags,
        attachment,
        sourcePath,
        allAttachments,
      ) =>
        withDocItemHelper(
          item,
          { tags, attachment, allAttachments },
          { plugin, sourcePath },
        ),
      getAnnotTextRenderer: (annotation, extra, sourcePath) => () =>
        this.plugin.templateRenderer.renderAnnot(annotation, extra, {
          plugin,
          sourcePath,
        }),
      itemDetailsProps,
      onDragStart: getDragStartHandler(this.plugin),
      onMoreOptions: getMoreOptionsHandler(this),
    };
  }

  protected async onOpen() {
    await super.onOpen();
    await this.untilZoteroReady();
    ReactDOM.render(
      <ObsidianCtx.Provider value={this.getContext()}>
        <AnnotsView />
      </ObsidianCtx.Provider>,
      this.contentEl,
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }
}
