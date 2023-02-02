import "./style.css";

import { Plugin } from "@aidenlx/zotero-helper/zotero";
import { uniqBy } from "@mobily/ts-belt/Array";
import { debounce } from "@mobily/ts-belt/Function";
import type {
  AnnotationsQuery,
  INotifyRegularItem,
  ItemQuery,
  ItemsQuery,
  QueryAction,
} from "@obzt/protocol";
import { stringifyQuery } from "@obzt/protocol";
import { assertNever } from "assert-never";
import type settings from "../prefs.json";

export default class ZoteroPlugin extends Plugin<typeof settings> {
  onInstall(): void | Promise<void> {
    this.app.log("zotero-obsidian-note Installed");
  }
  onUninstall(): void | Promise<void> {
    return;
  }
  onload(): void {
    this.app.log("zotero-obsidian-note Loaded");

    this.registerPref(
      "notify",
      (value) => {
        if (!value) return;
        this.registerNotifier(["item"]);
        this.register(
          this.events.item.on("add", (ids) => {
            if (this.settings.notify === false) return;
            this.app.log(`try notify items added: ${ids.join(", ")}`);
            ids.forEach((id) => {
              const item = this.app.Items.get(id);
              if (!item.isRegularItem()) return;
              this.#addedItemsNotifyQueue.set(item.id, [
                item.id,
                item.libraryID,
              ]);
            });
            this.requestNotifyItemAdded();
          }),
        );
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
      const libIdKey = this.app.Items.getLibraryAndKeyFromID(reader.itemID);
      if (!libIdKey) {
        this.app.logError(
          new Error(`Can't get library and key from item id ${reader.itemID}`),
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

  #addedItemsNotifyQueue = new Map<number, [id: number, lib: number]>();
  requestNotifyItemAdded = debounce(async () => {
    if (this.#addedItemsNotifyQueue.size === 0) return;
    const ids = Array.from(this.#addedItemsNotifyQueue.values());
    this.#addedItemsNotifyQueue.clear();

    const target = this.settings["notify-url"];
    this.app.log(`send to: ${target}`);

    await fetch(new URL("/notify", target), {
      method: "POST",
      body: JSON.stringify({
        event: "regular-item/add",
        ids,
      } satisfies INotifyRegularItem),
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.app.log(`notify item added: ${ids.join(", ")}`);
  }, 500);

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
