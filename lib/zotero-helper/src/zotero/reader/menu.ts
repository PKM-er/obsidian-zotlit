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

export interface ReaderMenuEvent {
  annot: (menu: Menu, data: AnnotPopupData, docItemID: number) => any;
  page: (
    menu: Menu,
    data: any,
    docItemID: number,
    secondView: boolean | undefined,
  ) => any;
  tags: (
    menu: Menu,
    tag: Zotero.Item,
    docItemID: number,
    selector: string,
  ) => any;
  color: (menu: Menu, data: any, docItemID: number) => any;
  thumbnail: (menu: Menu, data: any, docItemID: number) => any;
  selector: (menu: Menu, data: any, docItemID: number) => any;
}

export class ReaderMenuHelper extends Component {
  event = createNanoEvents<ReaderMenuEvent>();

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
    function* menuFrom(popupset: Element) {
      for (const popup of popupset.children) {
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

        yield menu;
        self.patchedPopups.add(popup);
      }
    }
    function getItemID(reader: _ZoteroTypes.ReaderInstance) {
      const itemID = reader.itemID;
      if (typeof itemID !== "number") {
        throw new Error("No itemID for reader " + reader._instanceID);
      }
      return itemID;
    }
    this.register(
      around(reader.constructor.prototype as _ZoteroTypes.ReaderInstance, {
        _openAnnotationPopup: (next) =>
          function (
            this: _ZoteroTypes.ReaderInstance,
            data: AnnotPopupData,
            ...args
          ) {
            const result = next.call(this, data, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset)) {
                self.event.emit("annot", menu, data, itemID);
              }
            } catch (error) {
              self.app.logError(error as Error);
            }
            return result;
          },
        _openPagePopup: (next) =>
          function (
            this: _ZoteroTypes.ReaderInstance,
            data,
            secondView,
            ...args
          ) {
            const result = next.call(this, data, secondView, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset as Element)) {
                self.event.emit("page", menu, data, itemID, secondView);
              }
            } catch (error) {
              self.app.logError(error as Error);
            }
            return result;
          },
        _openTagsPopup: (next) =>
          function (
            this: _ZoteroTypes.ReaderInstance,
            item: Zotero.Item,
            selector: string,
            ...args
          ) {
            const result = next.call(this, item, selector, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset as Element)) {
                self.event.emit("tags", menu, item, itemID, selector);
              }
            } catch (error) {
              self.app.logError(error as Error);
            }
            return result;
          },
        _openColorPopup: (next) =>
          function (this: _ZoteroTypes.ReaderInstance, data, ...args) {
            const result = next.call(this, data, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset as Element)) {
                self.event.emit("color", menu, data, itemID);
              }
            } catch (error) {
              self.app.logError(error as Error);
            }
            return result;
          },
        _openThumbnailPopup: (next) =>
          function (this: _ZoteroTypes.ReaderInstance, data, ...args) {
            const result = next.call(this, data, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset as Element)) {
                self.event.emit("thumbnail", menu, data, itemID);
              }
            } catch (error) {
              self.app.logError(error as Error);
            }
            return result;
          },
        _openSelectorPopup: (next) =>
          function (this: _ZoteroTypes.ReaderInstance, data, ...args) {
            const result = next.call(this, data, ...args);
            try {
              const itemID = getItemID(this);
              for (const menu of menuFrom(this._popupset as Element)) {
                self.event.emit("selector", menu, data, itemID);
              }
            } catch (error) {
              self.app.logError(error as Error);
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
