import { around } from "monkey-around";
import { createNanoEvents } from "nanoevents";
import { Component } from "../misc.js";
import { onReaderOpen } from "./utils.js";

export interface ReaderEvent {
  "annot-select": (
    key: string,
    selected: boolean,
    reader: _ZoteroTypes.ReaderInstance,
  ) => void;
}

export class ReaderEventHelper extends Component {
  constructor(public app: typeof Zotero) {
    super();
  }

  public onload(): void {
    const self = this;

    self.app.log("hooking into _initIframeWindow");
    const reader = this.app.Reader;

    // if reader is available, hook into existing iframe
    if (this.#hookInitIframeWindow(reader._readers)) {
      reader._readers.map((r) => this.#hookIframeWindow(r));
      return;
    }
    this.register(
      onReaderOpen(this.app.Reader, () =>
        this.#hookInitIframeWindow(reader._readers),
      ),
    );
  }

  event = createNanoEvents<ReaderEvent>();

  observers = new WeakMap<_ZoteroTypes.ReaderInstance, MutationObserver>();
  /**
   * @returns true if reader instance is available for hooking
   */
  #hookInitIframeWindow(readers: _ZoteroTypes.ReaderInstance[]): boolean {
    if (readers.length === 0) return false;
    const instance = readers[0];
    const self = this;
    this.register(
      around(instance.constructor.prototype as _ZoteroTypes.ReaderInstance, {
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
    this.app.Reader._readers.forEach((r) =>
      this.observers.get(r)?.disconnect(),
    );
  }

  async #hookIframeWindow(reader: _ZoteroTypes.ReaderInstance) {
    const self = this;

    await reader._initPromise;
    const window = reader._iframeWindow as unknown as typeof globalThis | null;
    if (!window) {
      self.app.logError(new Error("iframeWindow not found"));
      return;
    }

    const annotSidebar = window.document.getElementById("annotations");
    if (!annotSidebar) {
      self.app.logError(new Error("annotSidebar not found"));
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
          reader,
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
}
