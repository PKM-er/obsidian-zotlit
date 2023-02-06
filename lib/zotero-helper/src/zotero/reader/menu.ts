/* eslint-disable @typescript-eslint/no-this-alias */
import { around } from "monkey-around";
import { createNanoEvents } from "nanoevents";
import { Menu } from "../menu/menu.js";
import { Component } from "../misc.js";
import { onReaderOpen } from "./utils.js";

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

interface Event {
  menu: (
    menu: Menu,
    data: AnnotPopupData,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
}

export class ReaderMenuHelper extends Component {
  event = createNanoEvents<Event>();

  constructor(public app: typeof Zotero) {
    super();
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _openAnnotationPopup");
    if (this.#hookOpenAnnotPopup()) return;
    this.register(
      onReaderOpen(this.app.Reader, () => this.#hookOpenAnnotPopup()),
    );
  }

  patchedPopups = new WeakSet<Element>();

  #hookOpenAnnotPopup(): boolean {
    const readers = this.app.Reader._readers;
    if (readers.length === 0) return false;
    const reader = readers[0];
    const self = this;
    this.register(
      around(reader.constructor.prototype as _ZoteroTypes.ReaderInstance, {
        _openAnnotationPopup: (next) =>
          function (this: _ZoteroTypes.ReaderInstance, data: AnnotPopupData) {
            const result = next.call(this, data);
            for (const popup of (this._popupset as Element).children) {
              if (
                !popup ||
                self.patchedPopups.has(popup) ||
                popup.nodeName !== "menupopup"
              ) {
                continue;
              }
              const menu = new Menu({
                element: popup as XUL.MenuPopup,
                removeSelf: false,
              });
              self.event.emit("menu", menu, data, this);
              self.patchedPopups.add(popup);
            }
            return result;
          },
      }),
    );
    return true;
  }

  public onunload(): void {
    return;
  }
}
