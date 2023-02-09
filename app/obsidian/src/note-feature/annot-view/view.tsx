import { deleteKeys } from "@mobily/ts-belt/Dict";

import type { AnnotViewContextType, AnnotViewStore } from "@obzt/components";
import { ObsidianContext, AnnotViewContext, AnnotView } from "@obzt/components";
import { getCacheImagePath } from "@obzt/database";
import type { INotifyActiveReader } from "@obzt/protocol";
import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { Menu, ItemView } from "obsidian";
import ReactDOM from "react-dom";
import { chooseLiterature } from "../citation-suggest";
import type { AnnotRendererProps } from "./drag-insert";
import { getAnnotRenderer, getDragStartHandler } from "./drag-insert";
import { getMoreOptionsHandler } from "./more-options";
import type { StoreAPI } from "./store";
import { createStore } from "./store";
import { choosePDFAtch } from "@/components/atch-suggest";
import { context } from "@/components/basic/context";
import { untilZoteroReady } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";

import "./style.less";

export const annotViewType = "zotero-annotation-view";

interface State {
  itemId: number;
  attachmentId?: number;
  follow: AnnotViewStore["follow"];
}

export class AnnotationView extends ItemView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.store = createStore(plugin);
  }

  public getViewType(): string {
    return annotViewType;
  }

  #zoteroActiveItem: number | null = null;
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
        this.setStatePrev((state) => ({
          itemId,
          attachmentId,
          ...deleteKeys(state, ["itemId", "attachmentId"]),
        })).then(() => {
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
        if (data.event !== "reader/active") return;
        this.#zoteroActiveItem = data.itemId;
        if (
          this.follow !== "zt-reader" ||
          data.itemId < 0 ||
          data.attachmentId < 0
        )
          return;
        update(data);
      }),
    );
  }

  public getDisplayText(): string {
    // TODO: show current literature name
    return "Zotero Annotations";
    // const activeDoc = this.plugin.app.workspace.getActiveFile();
    // let suffix = "";
    // if (activeDoc?.extension === "md") suffix = ` for ${activeDoc.basename}`;
    // return "Zotero Annotations" + suffix;
  }

  public getIcon(): string {
    return "highlighter";
  }

  get lib() {
    return this.plugin.settings.database.citationLibrary;
  }
  store: StoreAPI;
  get follow() {
    return this.store.getState().follow;
  }
  getState(): State {
    // TODO: method to trigger state save?
    const data = super.getState();
    return {
      ...(data && typeof data === "object" ? data : {}),
      itemId: this.store.getState().doc?.docItem.itemID ?? -1,
      attachmentId: this.store.getState().attachment?.itemID ?? -1,
    };
  }
  async setState(state: State, _result?: ViewStateResult): Promise<void> {
    await super.setState(state, _result as any);
    const { itemId = -1, attachmentId = -1, follow = "zt-reader" } = state;
    this.store.getState().setFollow(follow);
    await this.store.getState().loadDocItem(itemId, attachmentId, this.lib);
  }
  async setStatePrev(update: (state: State) => State) {
    await this.setState(update(this.getState()));
  }

  onSetFollowZt = async () => {
    this.store.getState().setFollow("zt-reader");
    await this.setStatePrev(({ attachmentId, ...state }) => ({
      ...state,
      follow: "zt-reader",
      ...(this.#zoteroActiveItem === null
        ? { attachmentId }
        : { itemId: this.#zoteroActiveItem }),
    }));
  };
  onSetFollowNull = async () => {
    const { plugin, store } = this;
    const literature = await chooseLiterature(plugin);
    if (!literature) return;
    const { itemID } = literature.value.item;

    const lib = plugin.settings.database.citationLibrary;
    const attachments = await plugin.databaseAPI.getAttachments(itemID, lib);

    const atch = await choosePDFAtch(attachments);
    if (!atch) return;
    store.getState().setFollow(null);
    await store.getState().loadDocItem(itemID, atch.itemID, lib);
  };
  getContext(): AnnotViewContextType<AnnotRendererProps> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const { plugin, store, app } = self;
    return {
      store,
      registerDbUpdate(callback) {
        app.vault.on("zotero:db-refresh", callback);
        return () => app.vault.off("zotero:db-refresh", callback);
      },
      refreshConn: async () => {
        await plugin.dbWorker.refresh({ task: "dbConn" });
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
      onMoreOptions: getMoreOptionsHandler(self),
      annotRenderer: getAnnotRenderer(plugin),
      onSetFollow(event) {
        const menu = new Menu();
        const follow = store.getState().follow;
        if (follow !== "zt-reader") {
          menu.addItem((i) =>
            i.setTitle("Follow Zotero Reader").onClick(self.onSetFollowZt),
          );
        }
        menu.addItem((i) =>
          i.setTitle("Choose Literature").onClick(async () => {
            // prevent focus from transfering back from modal,
            // triggering another keyup event
            (event.target as HTMLElement).blur();
            await self.onSetFollowNull();
          }),
        );
        if (event.nativeEvent instanceof MouseEvent) {
          menu.showAtMouseEvent(event.nativeEvent);
        } else {
          const target = event.target as HTMLElement;
          const rect = target.getBoundingClientRect();
          menu.showAtPosition({ x: rect.x, y: rect.y });
        }
      },
    };
  }

  protected async onOpen() {
    await super.onOpen();
    const [task, cancel] = untilZoteroReady(this.plugin);
    cancel && this.register(cancel);
    await task;
    ReactDOM.render(
      <ObsidianContext.Provider value={context}>
        <AnnotViewContext.Provider value={this.getContext()}>
          <AnnotView />
        </AnnotViewContext.Provider>
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
