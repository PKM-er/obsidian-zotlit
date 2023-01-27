import "./style.css";

import { Plugin } from "@aidenlx/zotero-helper/zotero";
import { debounce } from "@mobily/ts-belt/Function";

export default class ZoteroPlugin extends Plugin {
  onInstall(): void | Promise<void> {
    this.app.log("Hello, world! Installed");
  }
  onUninstall(): void | Promise<void> {
    this.app.log("Hello, world! Uninstalled");
  }
  onload(): void {
    this.app.log("Hello, world! Loaded");

    this.registerNotifier(["item"]);
    this.register(
      this.events.item.on("add", (ids) => {
        this.notifyItemAdded(
          ids.filter((id) => this.app.Items.get(id).isRegularItem()),
        );
      }),
    );
    this.registerMenu("reader", (menu) =>
      menu.addItem((item) =>
        item
          .setTitle("Hello, world!")
          .onClick(() => this.app.log("Hello, world!")),
      ),
    );
    this.registerMenu("item", (menu) =>
      menu
        .addItem((item) =>
          item
            .setTitle("Hello, world!")
            .onClick(() => this.app.log("Hello, world!")),
        )
        .addSubmenu("I'm a submenu", (menu) =>
          menu
            .onShowing(() => this.app.log("Showing submenu"))
            .addItem((item) =>
              item
                .setTitle("Hello, world from submenu!")
                .onClick(() => this.app.log("Hello, world from submenu!")),
            ),
        ),
    );
  }
  onunload(): void {
    this.app.log("Hello, world! unloaded");
  }

  #addedItemsNotifyQueue = new Set<string>();
  #notifyItemAdded = debounce(async () => {
    const ids = Array.from(this.#addedItemsNotifyQueue);
    this.#addedItemsNotifyQueue.clear();
    await fetch("http://localhost:9091/notify", {
      method: "POST",
      body: JSON.stringify({ type: "item", event: "add", ids }),
    });
  }, 500);
  notifyItemAdded(ids: string[]) {
    ids.forEach((id) => this.#addedItemsNotifyQueue.add(id));
    this.#notifyItemAdded();
  }
}
