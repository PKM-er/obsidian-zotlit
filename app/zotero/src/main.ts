import "./style.css";

import { Plugin } from "@aidenlx/zotero-helper/zotero";
import { uniqBy } from "@mobily/ts-belt/Array";
import { debounce } from "@mobily/ts-belt/Function";
import type {
  AnnotationsQuery,
  INotify,
  INotifyReaderAnnotSelect,
  INotifyRegularItem,
  ItemQuery,
  ItemsQuery,
  QueryAction,
} from "@obzt/protocol";
import { stringifyQuery } from "@obzt/protocol";
import type { INotifyActiveReader } from "@obzt/protocol/dist/bg.js";
import { assertNever } from "assert-never";
import type settings from "../prefs.json";
import { Debouncer, ItemUpdateDebouncer } from "./debounced.js";

export default class ZoteroPlugin extends Plugin<typeof settings> {
  onInstall(): void | Promise<void> {
    this.app.log("zotero-obsidian-note Installed");
  }
  onUninstall(): void | Promise<void> {
    return;
  }

  /**
   * attachment id is focused in reader, -1 if reader is not focused
   */
  readerFocus = new Map<string, number>();
  lastActiveReader: number | null = null;
  onload(): void {
    this.app.log("zotero-obsidian-note Loaded");

    this.registerReaderEvent("focus", (itemId, instanceId) => {
      this.readerFocus.set(instanceId, itemId);
      if (this.settings.notify === false) return;
      this.request.nActiveReader();
    });
    this.registerReaderEvent("blur", (_itemId, instanceId) => {
      this.readerFocus.set(instanceId, -1);
      if (this.settings.notify === false) return;
      this.request.nActiveReader();
    });

    this.registerPref(
      "notify",
      (value) => {
        if (!value) return;
        this.registerNotifier(["item"]);
        const registerItemUpdate = (type: "add" | "modify" | "trash") => {
          this.register(
            this.events.item.on(type, (ids) => {
              if (this.settings.notify === false) return;
              this.app.log(`try notify items ${type}: ${ids.join(", ")}`);
              ids.forEach((id) => {
                const item = this.app.Items.get(id);
                if (!item.isRegularItem()) return;
                this.request.nItemUpdated(item.id, item.libraryID, type);
              });
            }),
          );
        };
        registerItemUpdate("add");
        registerItemUpdate("modify");
        registerItemUpdate("trash");

        this.registerReaderEvent("annot-select", (key, selected, itemId) => {
          if (this.settings.notify === false) return;
          const libId = this.app.Items.get(itemId).libraryID;
          const annotItem = this.app.Items.getByLibraryAndKey(libId, key);
          if (!annotItem) {
            this.app.logError(
              new Error(`Can't get annotation item by key ${key}`),
            );
            return;
          }
          this.request.nReaderAnnotSelect(annotItem.id, selected);
        });
      },
      true,
    );

    this.registerPrefPane({
      pluginID: this.id.full,
      src: this.getResourceURL("prefs.xhtml"),
      label: "Obsidian Note",
      image: this.getResourceURL(this.icons[32]),
    });
    this.registerMenu("item", (menu) =>
      menu
        .addItem((item) =>
          item
            .setTitle("Open Note in Obsidian")
            .onClick(() => this.handleSelectedItems("open"))
            .onShowing((item) =>
              item.toggle(
                this.app.getActiveZoteroPane().getSelectedItems().length === 1,
              ),
            ),
        )
        .addItem((item) =>
          item
            .setTitle("Create Notes in Obsidian")
            .onClick(() => this.handleSelectedItems("export"))
            .onShowing((item) =>
              item.toggle(
                this.app.getActiveZoteroPane().getSelectedItems().length >= 1,
              ),
            ),
        ),
    );

    this.registerMenu("reader", (menu, data, reader) => {
      const libIdKey = this.app.Items.getLibraryAndKeyFromID(
        reader.attachmentId,
      );
      if (!libIdKey) {
        this.app.logError(
          new Error(
            `Can't get library and key from item id ${reader.attachmentId}`,
          ),
        );
        return;
      }
      const { libraryID } = libIdKey;
      const getAnnotations = () => {
        const annots = data.ids.map((key) =>
          this.app.Items.getByLibraryAndKey(libraryID, key),
        ) as Zotero.Item[];
        if (annots.every((a) => a.isAnnotation())) return annots;
        throw new Error(
          `Can't get annotations from reader data: ${JSON.stringify(data)}`,
        );
      };
      menu.addItem((item) =>
        item
          .setTitle("Export to Obsidian Note")
          .onClick(() =>
            this.sendToObsidian("annotation", "export", getAnnotations()),
          )
          .onShowing((item) => item.toggle(data.ids.length > 0)),
      );
    });
  }
  onunload(): void {
    this.app.log("zotero-obsidian-note unloaded");
  }

  request = {
    nItemUpdated: ItemUpdateDebouncer.create(async (ids) => {
      await this.#notify<INotifyRegularItem>({
        event: "regular-item/update",
        /** itemid -> libid */
        ...ids,
      });
      this.app.log(`notify item added: ${JSON.stringify(ids)}`);
    }),
    nReaderAnnotSelect: Debouncer.create<boolean, number>(async (updates) => {
      await this.#notify<INotifyReaderAnnotSelect>({
        event: "reader/annot-select",
        updates,
      });
      this.app.log(
        `notify annot select: ${updates.map((a) => a[0]).join(", ")}`,
      );
    }),
    nActiveReader: debounce(async () => {
      const active = [...this.readerFocus.values()].filter((a) => a !== -1);
      const attachmentId = active[active.length - 1] ?? -1;
      if (attachmentId === this.lastActiveReader) return;
      const itemId = this.app.Items.get(attachmentId).parentItemID;
      if (typeof itemId !== "number") {
        // prevent notify when reader is not attached to an regular item's attachment
        this.lastActiveReader = attachmentId;
        return;
      }
      await this.#notify<INotifyActiveReader>({
        event: "reader/active",
        itemId,
        attachmentId,
      });
      this.lastActiveReader = attachmentId;
      this.app.log(`notify active reader: ${itemId}, ${attachmentId}`);
    }, 500),
  };

  async #notify<T extends INotify>(content: T) {
    const targets = this.settings["notify-url"].split(";");
    // this.app.log(`send to: ${target}`);
    // broadcast to all targets
    try {
      await Promise.all(
        targets.map((url) =>
          fetch(new URL("/notify", url), {
            method: "POST",
            body: JSON.stringify(content),
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ),
      );
    } catch (error) {
      this.app.log(`failed to notify to targets: ${targets.join(";")}`);
      throw error;
    }
  }

  handleSelectedItems(action: QueryAction) {
    let items: readonly Zotero.Item[] = this.app
      .getActiveZoteroPane()
      .getSelectedItems();
    if (items.length === 0) return;
    items = items
      .filter(
        (item: Zotero.Item): boolean =>
          item.isRegularItem() || // !note && !annotation && !attachment
          (item.isAttachment() && !!item?.parentItem?.isRegularItem()),
      )
      // get regular item
      .map((item: Zotero.Item) =>
        item.isAttachment() ? item.parentItem! : item,
      );
    if (items.length === 0) return;
    items = uniqBy(items, (i) => i.id);
    this.sendToObsidian("item", action, items);
  }

  /**
   * @param items should all be Regular Items / Annotation Items
   * @returns if url is sent to obsidian successfully
   */
  sendToObsidian(
    type: "item" | "annotation",
    action: QueryAction,
    items: readonly Zotero.Item[] | Zotero.Item[],
  ): boolean {
    if (items.length === 0) return false;

    let query;
    if (type === "item") {
      query = {
        version: this.version,
        type,
        items: items.map(buildItemRecord),
      } satisfies ItemsQuery;
    } else if (type === "annotation") {
      if (items.some((i) => !i.isAnnotation())) {
        this.app.logError(
          new Error("Can't send non-annotation items in annotation query"),
        );
        return false;
      }
      const parent = items[0].parentItem?.parentItem;
      if (!parent || !parent.isRegularItem()) {
        this.app.logError(
          new Error("Can't send annotation items without parent item"),
        );
        return false;
      }
      query = {
        version: this.version,
        type,
        annots: items.map(buildItemRecord),
        parent: buildItemRecord(parent),
      } satisfies AnnotationsQuery;
    } else {
      assertNever(type);
    }

    // use this as a patch to fix the url
    const url = stringifyQuery(`obsidian://zotero/${action}`, query);
    this.app.launchURL(url.toString());
    return true;
  }
}

const buildItemRecord = (item: Zotero.Item): ItemQuery => {
  const obj: ItemQuery = {
    key: item.key,
    id: item.id,
    libraryID: item.libraryID,
  };
  if (item.library.isGroup) obj.groupID = (item.library as any).groupID;
  return obj;
};
