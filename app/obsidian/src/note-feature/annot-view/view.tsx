import type { AnnotsViewContextType, AnnotsViewStore } from "@obzt/components";
import {
  ObsidianContext,
  AnnotsViewContext,
  AnnotsView,
} from "@obzt/components";
import { getCacheImagePath } from "@obzt/database";
import type { INotifyActiveReader } from "@obzt/protocol";
import { assertNever } from "assert-never";
import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import ReactDOM from "react-dom";
import { getAnnotRenderer, getDragStartHandler } from "./drag-insert";
import { getMoreOptionsHandler } from "./more-options";
import type { StoreAPI } from "./store";
import { createStore } from "./store";
import { context } from "@/components/context";
import { DatabaseStatus } from "@/services/zotero-db/connector/service";
import { waitUntil } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";

import "./style.less";

export const annotViewType = "zotero-annotation-view";

interface State {
  itemId: number;
  attachmentId: number;
  followZotero?: boolean;
}

export class AnnotationView extends ItemView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.store = createStore(plugin);
  }

  public getViewType(): string {
    return annotViewType;
  }

  onload(): void {
    super.onload();
    this.contentEl.addClass("obzt");

    let nextReader: INotifyActiveReader | null = null,
      locked = false;
    const update = (data: INotifyActiveReader) => {
      if (locked) {
        nextReader = data;
      } else {
        locked = true;
        const { itemId, attachmentId } = data;
        this.setState({ itemId, attachmentId }).then(() => {
          locked = false;
          if (nextReader === null) return;
          const next = nextReader;
          nextReader = null;
          update(next);
        });
      }
    };
    this.registerEvent(
      this.plugin.server.on("bg:notify", (_, data) => {
        if (
          !this.followZotero ||
          data.event !== "reader/active" ||
          data.itemId < 0 ||
          data.attachmentId < 0
        )
          return;
        update(data);
      }),
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

  untilZoteroReady() {
    const [task, cancel] = waitUntil({
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
    });
    cancel && this.register(cancel);
    return task;
  }

  get lib() {
    return this.plugin.settings.database.citationLibrary;
  }
  store: StoreAPI;
  followZotero = true;
  getState(): State {
    const data = super.getState();
    return {
      ...(data && typeof data === "object" ? data : {}),
      itemId: this.store.getState().doc?.docItem.itemID ?? -1,
      attachmentId: this.store.getState().attachment?.itemID ?? -1,
    };
  }
  async setState(state: State, _result?: ViewStateResult): Promise<void> {
    await super.setState(state, _result as any);
    const { itemId = -1, followZotero } = state;
    if (!Number.isInteger(+itemId) || +itemId < -1)
      throw new Error("invalid item id");
    await this.store.getState().loadDocItem(+itemId, -1, this.lib);
    if (followZotero !== undefined) {
      this.followZotero = Boolean(followZotero);
    }
  }

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
        </AnnotsViewContext.Provider>
      </ObsidianContext.Provider>,
      this.contentEl,
    );
    this.registerEvent(
      this.plugin.server.on("bg:notify", (_, data) => {
        if (data.event !== "reader/annot-select") return;
        const update = data.updates.filter(([, selected]) => selected).pop();
        if (!update) return;
        const [annotId] = update;
        this.highlightAnnot(annotId);
      }),
    );
  }
  protected async onClose() {
    ReactDOM.unmountComponentAtNode(this.contentEl);
    await super.onClose();
  }

  async highlightAnnot(annotId: number) {
    const element = this.contentEl.querySelector(
      `.annot-preview[data-id="${annotId}"]`,
    );
    if (!(element instanceof HTMLElement)) return;
    element.addClass("select-flashing");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(1500);
    element.removeClass("select-flashing");
  }
}
