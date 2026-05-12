/* eslint-disable @typescript-eslint/no-this-alias */
import { around } from "monkey-around";
import { createNanoEvents } from "nanoevents";
import { Menu } from "../menu/menu.js";
import { appendReaderMenu } from "../menu/official.js";
import { Component } from "../misc.js";
import {
  getReaderPopupset,
  getReaderPrototype,
  onReaderOpen,
} from "./utils.js";

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

export class ReaderMenuHelper extends Component {
  event = createNanoEvents<ReaderMenuEvent>();

  constructor(
    public app: typeof Zotero,
    private pluginID: string,
  ) {
    super();
  }

  public onload(): void {
    const self = this;

    if (this.#registerOfficialListeners()) {
      return;
    }

    self.app.log("hooking into _openAnnotationPopup");
    if (this.#hookOpenAnnotPopup()) return;
    this.register(
      onReaderOpen(this.app.Reader, () => this.#hookOpenAnnotPopup()),
    );
  }

  patchedPopups = new WeakSet<Element>();

  #registerOfficialListeners(): boolean {
    const reader = this.app.Reader as _ZoteroTypes.Reader & {
      registerEventListener?: (
        type: string,
        handler: (event: any) => void,
        pluginID: string,
      ) => void;
      unregisterEventListener?: (type: string, handler: (event: any) => void) => void;
    };
    if (typeof reader.registerEventListener !== "function") {
      return false;
    }
    const register = (
      type: string,
      emit: (event: any, menu: Menu) => void,
    ) => {
      const handler = (event: any) => {
        try {
          const menu = Menu.virtual();
          emit(event, menu);
          appendReaderMenu(event, menu);
        } catch (error) {
          this.app.logError(error as Error);
        }
      };
      reader.registerEventListener!(type, handler, this.pluginID);
      if (typeof reader.unregisterEventListener === "function") {
        this.register(() => reader.unregisterEventListener!(type, handler));
      }
    };

    register("createAnnotationContextMenu", (event, menu) => {
      this.event.emit(
        "annot",
        menu,
        event.params,
        event.reader.itemID,
        event.reader,
      );
    });
    register("createViewContextMenu", (event, menu) => {
      this.event.emit(
        "page",
        menu,
        event.params,
        event.reader.itemID,
        undefined,
        event.reader,
      );
    });
    register("createColorContextMenu", (event, menu) => {
      this.event.emit(
        "color",
        menu,
        event.params,
        event.reader.itemID,
        event.reader,
      );
    });
    register("createThumbnailContextMenu", (event, menu) => {
      this.event.emit(
        "thumbnail",
        menu,
        event.params,
        event.reader.itemID,
        event.reader,
      );
    });
    register("createSelectorContextMenu", (event, menu) => {
      this.event.emit(
        "selector",
        menu,
        event.params,
        event.reader.itemID,
        event.reader,
      );
    });
    return true;
  }

  #hookOpenAnnotPopup(): boolean {
    const prototype = getReaderPrototype(this.app.Reader);
    if (!prototype) return false;
    const proto = prototype as Record<string, unknown>;
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
    const resolveMethodName = (legacy: string, modern: string) =>
      typeof proto[legacy] === "function"
        ? legacy
        : typeof proto[modern] === "function"
          ? modern
          : null;
    const patches: Record<string, (next: (...args: any[]) => any) => any> = {};
    const annotPopup = resolveMethodName(
      "_openAnnotationPopup",
      "openAnnotationPopup",
    );
    const pagePopup = resolveMethodName("_openPagePopup", "openPagePopup");
    const tagsPopup = resolveMethodName("_openTagsPopup", "openTagsPopup");
    const colorPopup = resolveMethodName("_openColorPopup", "openColorPopup");
    const thumbnailPopup = resolveMethodName(
      "_openThumbnailPopup",
      "openThumbnailPopup",
    );
    const selectorPopup = resolveMethodName(
      "_openSelectorPopup",
      "openSelectorPopup",
    );
    if (annotPopup) {
      patches[annotPopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: AnnotPopupData,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("annot", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (pagePopup) {
      patches[pagePopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: unknown,
          secondView: boolean,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, data, secondView, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("page", menu, data, itemID, secondView, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (tagsPopup) {
      patches[tagsPopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          item: Zotero.Item,
          selector: string,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, item, selector, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("tags", menu, item, itemID, selector, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (colorPopup) {
      patches[colorPopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: AnnotPopupData,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("color", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (thumbnailPopup) {
      patches[thumbnailPopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: unknown,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("thumbnail", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (selectorPopup) {
      patches[selectorPopup] = (next) =>
        function (
          this: _ZoteroTypes.ReaderInstance,
          data: unknown,
          ...args: unknown[]
        ) {
          const reader = this;
          const result = next.call(this, data, ...args);
          try {
            const itemID = getItemID(this);
            const popupset = getReaderPopupset(this);
            if (!popupset) return result;
            for (const menu of menuFrom(popupset)) {
              self.event.emit("selector", menu, data, itemID, reader);
            }
          } catch (error) {
            self.app.logError(error as Error);
          }
          return result;
        };
    }
    if (Object.keys(patches).length === 0) return false;
    this.register(
      around(prototype as _ZoteroTypes.ReaderInstance, patches),
    );
    return true;
  }

  public onunload(): void {
    return;
  }
}
