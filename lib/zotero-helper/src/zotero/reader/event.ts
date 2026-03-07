import { around } from "monkey-around";
import { createNanoEvents } from "nanoevents";
import { Component } from "../misc.js";
import { onReaderOpen } from "./utils.js";

export interface ReaderEvent {
  "annot-select": (key: string, selected: boolean, itemId: number) => void;
  focus: (attachmentId: number, instanceId: string) => void;
  blur: (attachmentId: number, instanceId: string) => void;
}

/** Safely access Reader._readers, returning empty array if unavailable */
function getReaders(reader: _ZoteroTypes.Reader): _ZoteroTypes.ReaderInstance[] {
  return (reader as any)._readers ?? [];
}

export class ReaderEventHelper extends Component {
  constructor(public app: typeof Zotero) {
    super();
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _initIframeWindow");
    const reader = this.app.Reader;

    try {
      const readers = getReaders(reader);
      // if reader is available, hook into existing iframe
      if (this.#hookInitIframeWindow(readers)) {
        readers.map((r) => this.#hookIframeWindow(r));
        return;
      }
      this.register(
        onReaderOpen(this.app.Reader, () =>
          this.#hookInitIframeWindow(getReaders(reader)),
        ),
      );
    } catch (e) {
      self.app.logError(e as Error);
      self.app.log(
        "ZotLit: Failed to hook reader events. Reader features may be unavailable in this Zotero version.",
      );
    }
  }

  event = createNanoEvents<ReaderEvent>();

  observers = new WeakMap<_ZoteroTypes.ReaderInstance, MutationObserver>();
  /**
   * @returns true if reader instance is available for hooking
   */
  #hookInitIframeWindow(readers: _ZoteroTypes.ReaderInstance[]): boolean {
    if (readers.length === 0) return false;
    const instance = readers[0];
    const proto = instance.constructor.prototype as _ZoteroTypes.ReaderInstance;
    if (typeof (proto as any)._initIframeWindow !== "function") {
      this.app.log(
        "ZotLit: _initIframeWindow not found on reader prototype. Reader event hooks unavailable.",
      );
      return true; // Return true to prevent retrying via onReaderOpen
    }
    const self = this;
    this.register(
      around(proto, {
        _initIframeWindow: (next) =>
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
    try {
      getReaders(this.app.Reader).forEach((r) => {
        this.observers.get(r)?.disconnect();
        const onFocus = this.focusHandlers.get(r),
          onBlur = this.blurHandlers.get(r);
        onFocus && r._iframeWindow?.removeEventListener("focus", onFocus);
        onBlur && r._iframeWindow?.removeEventListener("blur", onBlur);
      });
    } catch (e) {
      this.app.logError(e as Error);
    }
  }

  async #hookIframeWindow(reader: _ZoteroTypes.ReaderInstance) {
    try {
      await reader._initPromise;
      const window = reader._iframeWindow as unknown as typeof globalThis | null;
      if (!window) {
        this.app.logError(new Error("iframeWindow not found"));
        return;
      }
      this.#watchAnnotSelect(window, reader);
      this.#watchFocusChange(window, reader);
    } catch (e) {
      this.app.logError(e as Error);
      this.app.log(
        "ZotLit: Failed to hook iframe window for reader. Some reader features may be unavailable.",
      );
    }
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
