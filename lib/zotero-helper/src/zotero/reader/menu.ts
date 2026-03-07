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
  annot: (
    menu: Menu,
    data: AnnotPopupData,
    docItemID: number,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
  page: (
    menu: Menu,
    data: any,
    docItemID: number,
    secondView: boolean | undefined,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
  tags: (
    menu: Menu,
    tag: Zotero.Item,
    docItemID: number,
    selector: string,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
  color: (
    menu: Menu,
    data: any,
    docItemID: number,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
  thumbnail: (
    menu: Menu,
    data: any,
    docItemID: number,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
  selector: (
    menu: Menu,
    data: any,
    docItemID: number,
    reader: _ZoteroTypes.ReaderInstance,
  ) => any;
}

/** Safely access Reader._readers, returning empty array if unavailable */
function getReaders(reader: _ZoteroTypes.Reader): _ZoteroTypes.ReaderInstance[] {
  return (reader as any)._readers ?? [];
}

export class ReaderMenuHelper extends Component {
  event = createNanoEvents<ReaderMenuEvent>();

  constructor(public app: typeof Zotero) {
    super();
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _openAnnotationPopup");
    try {
      if (this.#hookOpenAnnotPopup()) return;
      this.register(
        onReaderOpen(this.app.Reader, () => this.#hookOpenAnnotPopup()),
      );
    } catch (e) {
      self.app.logError(e as Error);
      self.app.log(
        "ZotLit: Failed to hook reader menus. Reader context menu features may be unavailable in this Zotero version.",
      );
    }
  }

  patchedPopups = new WeakSet<Element>();

  #hookOpenAnnotPopup(): boolean {
    const readers = getReaders(this.app.Reader);
    if (readers.length === 0) return false;
    const reader = readers[0];
    const proto = reader.constructor.prototype as any;
    const self = this;

    // Check which private popup methods exist on the prototype
    const popupMethods = [
      "_openAnnotationPopup",
      "_openPagePopup",
      "_openTagsPopup",
      "_openColorPopup",
      "_openThumbnailPopup",
      "_openSelectorPopup",
    ] as const;
    const missingMethods = popupMethods.filter(
      (m) => typeof proto[m] !== "function",
    );
    if (missingMethods.length > 0) {
      self.app.log(
        `ZotLit: Reader popup methods not found: ${missingMethods.join(", ")}. Reader context menus may be unavailable in this Zotero version.`,
      );
    }
    if (missingMethods.length === popupMethods.length) {
      // None of the methods exist — skip monkey-patching entirely
      return true;
    }

    function* menuFrom(popupset: Element | undefined | null) {
      if (!popupset) return;
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

    // Build patches only for methods that exist
    const patches: Record<string, any> = {};

    if (typeof proto._openAnnotationPopup === "function") {
      patches._openAnnotationPopup = (next: any) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: AnnotPopupData,
          ...args: any[]
        ) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset)) {
              self.event.emit("annot", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (typeof proto._openPagePopup === "function") {
      patches._openPagePopup = (next: any) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: any,
          secondView: any,
          ...args: any[]
        ) {
          const reader = this;
          const result = next.call(this, data, secondView, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset as Element)) {
              self.event.emit("page", menu, data, itemID, secondView, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (typeof proto._openTagsPopup === "function") {
      patches._openTagsPopup = (next: any) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          item: Zotero.Item,
          selector: string,
          ...args: any[]
        ) {
          const reader = this;
          const result = next.call(this, item, selector, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset as Element)) {
              self.event.emit("tags", menu, item, itemID, selector, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (typeof proto._openColorPopup === "function") {
      patches._openColorPopup = (next: any) =>
        function (this: _ZoteroTypes.ReaderInstance, data: any, ...args: any[]) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset as Element)) {
              self.event.emit("color", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (typeof proto._openThumbnailPopup === "function") {
      patches._openThumbnailPopup = (next: any) =>
        function (this: _ZoteroTypes.ReaderInstance, data: any, ...args: any[]) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset as Element)) {
              self.event.emit("thumbnail", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (typeof proto._openSelectorPopup === "function") {
      patches._openSelectorPopup = (next: any) =>
        function (this: _ZoteroTypes.ReaderInstance, data: any, ...args: any[]) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            for (const menu of menuFrom(this._popupset as Element)) {
              self.event.emit("selector", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }

    if (Object.keys(patches).length > 0) {
      this.register(around(proto, patches));
    }
    return true;
  }

  public onunload(): void {
    return;
  }
}
