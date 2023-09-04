import { pathToFileURL } from "url";
import type { AnnotViewContextType, AnnotViewStore } from "@obzt/components";
import { ObsidianContext, AnnotViewContext, AnnotView } from "@obzt/components";
import { getCacheImagePath } from "@obzt/database";
import type { INotifyActiveReader } from "@obzt/protocol";
import type { ViewStateResult, WorkspaceLeaf } from "obsidian";
import { Platform, Menu } from "obsidian";
import ReactDOM from "react-dom";
import { choosePDFAtch } from "@/components/atch-suggest";
import { context } from "@/components/basic/context";
import { DerivedFileView } from "@/components/derived-file-view";
import { getItemKeyOf } from "@/services/note-index";
import { getAtchIDsOf } from "@/services/note-index/utils";
import { untilZoteroReady } from "@/utils/once";
import type ZoteroPlugin from "@/zt-main";
import { chooseLiterature } from "../citation-suggest";
import { openTemplatePreview } from "../template-preview/open";
import type { AnnotRendererProps } from "./drag-insert";
import { getAnnotRenderer, getDragStartHandler } from "./drag-insert";
import { getMoreOptionsHandler } from "./more-options";
import type { StoreAPI } from "./store";
import { createStore } from "./store";

import "./style.less";

export const annotViewType = "zotero-annotation-view";

interface State {
  itemId: number;
  attachmentId?: number;
  follow: AnnotViewStore["follow"];
}

export class AnnotationView extends DerivedFileView {
  constructor(leaf: WorkspaceLeaf, public plugin: ZoteroPlugin) {
    super(leaf);
    this.store = createStore(plugin);
  }
  update() {
    if (this.follow !== "ob-note") return;
    const lib = this.plugin.settings.database.citationLibrary;
    (async () => {
      if (this.file?.extension !== "md") return false;
      const itemKey = getItemKeyOf(this.file, this.app.metadataCache);
      const attachments = getAtchIDsOf(this.file, this.app.metadataCache);
      if (!itemKey) return false;
      const [item] = await this.plugin.databaseAPI.getItems([[itemKey, lib]]);
      if (!item) return false;
      this.setStatePrev((state) => ({
        ...state,
        follow: "ob-note",
        itemId: item.itemID,
        attachmentId: attachments?.[0] ?? undefined,
      }));
      return true;
    })().then((result) => {
      if (!result)
        this.setStatePrev((state) => ({
          ...state,
          follow: "ob-note",
          itemId: -1,
        }));
    });
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
    const updateZtReader = (data: INotifyActiveReader) => {
      if (locked) {
        nextReader = data;
      } else {
        locked = true;
        const { itemId, attachmentId } = data;
        this.setStatePrev((state) => ({
          ...state,
          itemId,
          attachmentId,
        })).then(() => {
          locked = false;
          if (nextReader === null) return;
          const next = nextReader;
          nextReader = null;
          updateZtReader(next);
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
        updateZtReader(data);
      }),
    );
  }

  public getDisplayText(): string {
    if (this.follow !== "ob-note" || !this.file?.basename) {
      return "Zotero Annotations";
    }
    return `Zotero Annotations for ${this.file.basename}`;
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
    const data = super.getState();
    const curr = this.store.getState();
    const output: State = {
      itemId: curr.doc?.docItem.itemID ?? -1,
      attachmentId: curr.attachment?.itemID ?? -1,
      follow: curr.follow,
    };
    return {
      ...(data && typeof data === "object" ? data : {}),
      ...output,
    };
  }
  async setState(state: State, _result?: ViewStateResult): Promise<void> {
    await super.setState(state, (_result ?? {}) as any);
    const { itemId = -1, attachmentId = -1, follow = "zt-reader" } = state;
    this.store.getState().setFollow(follow);
    await this.store.getState().loadDocItem(itemId, attachmentId, this.lib);
  }
  async setStatePrev(update: (state: State) => State) {
    await this.setState(update(this.getState()));
  }

  onSetFollowZt = async () => {
    this.setStatePrev((state) => ({ ...state, follow: "zt-reader" }));
    await this.setStatePrev(({ attachmentId, ...state }) => ({
      ...state,
      follow: "zt-reader",
      ...(this.#zoteroActiveItem === null
        ? { attachmentId }
        : { itemId: this.#zoteroActiveItem }),
    }));
  };
  onSetFollowOb = () => {
    this.store.getState().setFollow("ob-note");
    this.update();
  };
  onSetFollowNull = async () => {
    const { plugin } = this;
    const literature = await chooseLiterature(plugin);
    if (!literature) return;
    const { itemID } = literature.value.item;

    const lib = plugin.settings.database.citationLibrary;
    const attachments = await plugin.databaseAPI.getAttachments(itemID, lib);

    const atch = await choosePDFAtch(attachments, this.app);
    if (!atch) return;
    await this.setStatePrev(({ attachmentId, ...state }) => ({
      ...state,
      follow: null,
      itemId: itemID,
      attachmentId: atch.itemID,
    }));
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
        const path = getCacheImagePath(
          annotation,
          plugin.settings.database.zoteroDataDir,
        );
        return getFSResourcePath(path);
      },
      onShowDetails: async (type, itemId) => {
        const state = store.getState(),
          attachment = state.attachmentID ?? undefined;
        if (type === "doc-item") {
          await openTemplatePreview(
            "note",
            { docItem: itemId, attachment },
            plugin,
          );
        } else {
          const docItem = state.doc?.docItem.itemID;
          if (!docItem) {
            throw new Error("Missing doc item when showing annotation details");
          }
          await openTemplatePreview(
            "annotation",
            { docItem, attachment, annot: itemId },
            plugin,
          );
        }
      },
      onDragStart: getDragStartHandler(plugin),
      onMoreOptions: getMoreOptionsHandler(self),
      annotRenderer: getAnnotRenderer(plugin),
      onSetFollow(event) {
        const menu = new Menu();
        const follow = store.getState().follow;
        if (follow !== "zt-reader") {
          menu.addItem((i) =>
            i
              .setIcon("book")
              .setTitle("Follow Active Literature in Zotero Reader")
              .onClick(self.onSetFollowZt),
          );
        }
        if (follow !== "ob-note") {
          menu.addItem((i) =>
            i
              .setIcon("file-edit")
              .setTitle("Follow Active Literature Note")
              .onClick(self.onSetFollowOb),
          );
        }
        menu.addItem((i) =>
          i
            .setIcon("file-lock-2")
            .setTitle("Link with Selected Literature")
            .onClick(async () => {
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

    this.contentEl.empty();
    this.contentEl.createDiv({ cls: "pane-empty p-2", text: "Loading..." });
    // defer to prevent blocking obsidian workspace initial loading
    task
      .then(() => {
        this.contentEl.empty();
        ReactDOM.render(
          <ObsidianContext.Provider value={context}>
            <AnnotViewContext.Provider value={this.getContext()}>
              <AnnotView />
            </AnnotViewContext.Provider>
          </ObsidianContext.Provider>,
          this.contentEl,
        );
      })
      .catch((err) => {
        this.contentEl.empty();
        console.error(`Failed to load annot view: `, err);
        this.contentEl.createDiv({
          cls: "pane-empty p-2",
          text: "Failed to load, Check console for details",
        });
      });
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

/**
 * desktop only, get resource path for filesystem access
 * @param path absolute path to the file
 */
function getFSResourcePath(path: string) {
  return (
    (Platform.resourcePathPrefix ?? "app://local/") +
    // remove leading slash in pathname
    pathToFileURL(path).pathname.substring(1) +
    `?${Date.now()}`
  );
}
