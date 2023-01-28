/* eslint-disable @typescript-eslint/no-this-alias */
import { around } from "monkey-around";
import { Component } from "../misc.js";
import { Menu } from "./menu.js";

export interface AnnotPopupData {
  [key: string]: any;
  enableEditHighlightedText:
    | false
    | {
        [key: string]: any;
        comment: string;
        libraryID: number;
        /** itemKEY not itemID */
        id: string;
        tags: { name: string; [key: string]: any }[];
      };
  /** itemKEY not itemID */
  currentID: string;
  /** itemKEY of all selected items */
  ids: string[];
}

export class ReaderMenuHelper extends Component {
  private menuCallbacks: ((
    menu: Menu,
    data: AnnotPopupData,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any)[] = [];

  constructor(public app: typeof Zotero) {
    super();
  }

  registerMenu(cb: (menu: Menu) => any): void {
    this.menuCallbacks.push(cb);
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _openAnnotationPopup");
    if (this.#hookOpenAnnotPopup()) return;
    const unload = around(self.app.Reader, {
      open: (next) =>
        function (this: _ZoteroTypes.Reader, ...args) {
          const result = next.apply(this, args);
          self.app.log("Reader opened, hooking into _openAnnotationPopup");
          if (self.#hookOpenAnnotPopup()) {
            unload();
          }
          return result;
        },
    });
    this.register(unload);
  }

  #hookOpenAnnotPopup(): boolean {
    const readers = this.app.Reader._readers;
    if (readers.length === 0) return false;
    const reader = readers[0];
    const self = this;
    const Zotero = this.app;
    this.register(
      around(reader.constructor.prototype as _ZoteroTypes.ReaderInstance, {
        _openAnnotationPopup: (next) =>
          function (this: _ZoteroTypes.ReaderInstance, data: AnnotPopupData) {
            const result = next.call(this, data);
            const popup = (this._popupset as Element).firstChild;
            if (!popup || popup.nodeName !== "menupopup") {
              Zotero.log("No popup found while trying to add annotation popup");
              return;
            }
            const menu = new Menu(popup as XUL.MenuPopup);
            self.menuCallbacks.forEach((cb) => cb(menu, data, this));
            return result;
          },
      }),
    );
    return true;
  }

  public onunload(): void {
    this.menuCallbacks.length = 0;
  }
}
