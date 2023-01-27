import { around } from "monkey-around";
import { Component } from "../misc.js";
import { Menu } from "./menu.js";

export class ReaderMenuHelper extends Component {
  #menuCallbacks: ((menu: Menu) => any)[] = [];
  #observedPopupsets = new WeakSet<Node>();
  #menuObserver: MutationObserver;

  constructor(public app: typeof Zotero) {
    super();
    this.#menuObserver = new mainWindow.MutationObserver((mutations) => {
      for (const mu of mutations) {
        for (let i = 0; i < mu.addedNodes.length; i++) {
          const node = mu.addedNodes[i];
          if (node.nodeName !== "menupopup") continue;
          const menu = new Menu(node as XUL.MenuPopup);
          this.#menuCallbacks.forEach((cb) => cb(menu));
        }
      }
    });
  }

  registerMenu(cb: (menu: Menu) => any): void {
    this.#menuCallbacks.push(cb);
  }

  public onload(): void {
    const observe = this.#observe,
      Zotero = this.app;

    Zotero.log("registering existing reader's menu");
    observe(Zotero.Reader._readers);
    this.register(
      around(Zotero.Reader, {
        open: (next) =>
          function (this: _ZoteroTypes.Reader, ...args) {
            const result = next.apply(this, args);
            Zotero.log("Reader opened, registering menu");
            observe(this._readers);
            return result;
          },
      }),
    );
  }

  #observe = (readers: _ZoteroTypes.ReaderInstance[]) => {
    readers.forEach((r) => {
      if (this.#observedPopupsets.has(r._popupset)) return;
      this.#menuObserver.observe(r._popupset, {
        childList: true,
      });
      this.#observedPopupsets.add(r._popupset);
    });
  };

  public onunload(): void {
    this.#menuObserver.disconnect();
    this.#menuCallbacks.length = 0;
  }
}
