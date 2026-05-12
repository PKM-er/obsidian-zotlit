import { around } from "monkey-around";
import { createNanoEvents } from "nanoevents";
import { Component } from "../misc.js";
import {
  getReaderIframeWindow,
  getReaderInstances,
  getReaderPrototype,
  onReaderOpen,
} from "./utils.js";

export interface ReaderEvent {
  "annot-select": (key: string, selected: boolean, itemId: number) => void;
  focus: (attachmentId: number, instanceId: string) => void;
  blur: (attachmentId: number, instanceId: string) => void;
}

export class ReaderEventHelper extends Component {
  constructor(public app: typeof Zotero) {
    super();
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _initIframeWindow");
    const reader = this.app.Reader;
    const existingReaders = getReaderInstances(reader);

    // if reader is available, hook into existing iframe
    if (this.#hookInitIframeWindow()) {
      existingReaders.map((r) => this.#hookIframeWindow(r));
      return;
    }
    this.register(
      onReaderOpen(this.app.Reader, () => this.#hookInitIframeWindow()),
    );
  }

  event = createNanoEvents<ReaderEvent>();

  observers = new WeakMap<_ZoteroTypes.ReaderInstance, MutationObserver>();
  /**
   * @returns true if reader instance is available for hooking
   */
  #hookInitIframeWindow(): boolean {
    const prototype = getReaderPrototype(this.app.Reader);
    if (!prototype) return false;
    const methodName =
      typeof (prototype as any)._initIframeWindow === "function"
        ? "_initIframeWindow"
        : typeof (prototype as any).initIframeWindow === "function"
          ? "initIframeWindow"
          : null;
    if (!methodName) return false;
    const self = this;
    this.register(
      around(prototype as _ZoteroTypes.ReaderInstance, {
        [methodName]: (next: (...args: any[]) => any) =>
          function (this: _ZoteroTypes.ReaderInstance) {
            const result = next.call(this);
            self.#hookIframeWindow(this);
            return result;
          },
      }),
    );
    return true;
  }

  public onunload(): void {
    getReaderInstances(this.app.Reader).forEach((r) => {
      this.observers.get(r)?.disconnect();
      const onFocus = this.focusHandlers.get(r),
        onBlur = this.blurHandlers.get(r);
      const iframeWindow = getReaderIframeWindow(r);
      onFocus && iframeWindow?.removeEventListener("focus", onFocus);
      onBlur && iframeWindow?.removeEventListener("blur", onBlur);
    });
  }

  async #hookIframeWindow(reader: _ZoteroTypes.ReaderInstance) {
    await reader._initPromise;
    const window = getReaderIframeWindow(reader);
    if (!window) {
      this.app.logError(new Error("iframeWindow not found"));
      return;
    }
    this.#watchAnnotSelect(window, reader);
    this.#watchFocusChange(window, reader);
  }
  #watchAnnotSelect(
    window: typeof globalThis,
    reader: _ZoteroTypes.ReaderInstance,
  ) {
    const self = this;
    const annotSidebar = window.document.getElementById("annotations");
    if (!annotSidebar) {
      self.app.logError(new Error("annotSidebar not found"));
      return;
    }
    const itemId = reader.itemID;
    if (!itemId) {
      self.app.logError(
        new Error("No itemID for reader " + reader._instanceID),
      );
      return;
    }
    const observer = new window.MutationObserver((mutations) => {
      mutations.forEach(function ({ target, oldValue }) {
        if (
          !(
            target instanceof window.HTMLElement &&
            target.classList.contains("annotation") &&
            target.dataset.sidebarAnnotationId
          )
        )
          return;
        const prevClassList = oldValue?.split(" ") ?? [];

        const currSelected = target.classList.contains("selected");
        if (prevClassList.includes("selected") === currSelected) return;
        self.event.emit(
          "annot-select",
          target.dataset.sidebarAnnotationId,
          currSelected,
          itemId,
        );
      });
    });
    observer.observe(annotSidebar, {
      attributeFilter: ["class"],
      attributeOldValue: true,
      subtree: true,
    });
    self.observers.set(reader, observer);
  }

  focusHandlers = new WeakMap<_ZoteroTypes.ReaderInstance, () => void>();
  blurHandlers = new WeakMap<_ZoteroTypes.ReaderInstance, () => void>();
  #watchFocusChange(
    window: typeof globalThis,
    reader: _ZoteroTypes.ReaderInstance,
  ) {
    const { _instanceID } = reader;
    const attachmentId = reader.itemID;
    if (!attachmentId) {
      this.app.logError(
        new Error("No itemID for reader " + reader._instanceID),
      );
      return;
    }
    const focusHandler = () =>
        this.event.emit("focus", attachmentId, _instanceID),
      blurHandler = () => this.event.emit("blur", attachmentId, _instanceID);
    window.addEventListener("focus", focusHandler);
    window.addEventListener("blur", blurHandler);
    this.focusHandlers.set(reader, focusHandler);
    this.blurHandlers.set(reader, blurHandler);
  }
}
