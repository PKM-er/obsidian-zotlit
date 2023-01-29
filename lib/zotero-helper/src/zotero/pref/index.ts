import { NS } from "../../const.js";
import { isXULElement, isZotero7, parseXHTML } from "../helper.js";
import { Component } from "../misc.js";
import type { IPreferencePaneDescriptor, Zotero7 } from "./pref-type.js";
import "core-js/actual/queue-microtask.js";

export interface IPaneDescriptor extends IPreferencePaneDescriptor {
  defaultNS?: "HTML" | "XUL";
  /** only work in Zotero 6 */
  onload?: () => any;
}

export class PreferencePane extends Component {
  constructor(
    private descriptor: IPaneDescriptor,
    ctx: {
      Zotero: typeof Zotero;
      Service: any;
    },
  ) {
    super();
    this.app = ctx.Zotero;
    this.Service = ctx.Service;
  }
  app: typeof Zotero;
  Service: any;

  get Zotero7(): Zotero7 | null {
    return isZotero7(this.app) ? (this.app as unknown as Zotero7) : null;
  }

  public onload(): void {
    this.registerPane(this.descriptor);
  }

  registerPane(descriptor: IPaneDescriptor) {
    if (this.Zotero7) {
      const Zotero = this.Zotero7;
      const paneId = Zotero.PreferencePanes.register(descriptor);
      paneId.then((paneId) => {
        this.register(() => Zotero.PreferencePanes.unregister(paneId));
      });
      return;
    }

    const listener = {
      onOpenWindow: (xulWindow: any) => {
        const win: Window = xulWindow
          .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
          .getInterface(Components.interfaces.nsIDOMWindow);
        win.addEventListener(
          "load",
          async () => {
            if (
              win.location.href !==
              "chrome://zotero/content/preferences/preferences.xul"
            )
              return;
            await this.#onOpenZt6PrefPane(win, descriptor);
          },
          { once: true },
        );
      },
    };
    Services.wm.addListener(listener);
    this.register(() => Services.wm.removeListener(listener));
  }

  async #onOpenZt6PrefPane(win: Window, descriptor: IPaneDescriptor) {
    const [frag, id] = await this.#genPrefPane(descriptor);
    const prefWindow = win.document.querySelector(
      "prefwindow",
    )! as XUL.Element & { addPane: (pane: Element) => void };
    prefWindow.appendChild(frag);

    const prefPane = win.document.getElementById(id)!;
    prefWindow.addPane(prefPane);

    this.#initPaneLayout(win, id);
    this.#initPrefValBindings(prefPane);

    for (const script of descriptor.scripts ?? []) {
      this.Service.scriptloader.loadSubScript(script, win);
    }
    descriptor.onload?.();
  }

  /**
   * https://github.com/windingwind/zotero-plugin-toolkit/blob/ce4b88062952b01fcf344afb18fe03176ac58719/src/managers/preferencePane.ts
   */
  #initPaneLayout(win: any, id: string) {
    if (!win.document.getAnonymousNodes || !win.sizeToContent)
      throw new Error(
        "document.GetAnonymousNodes or window.sizeToContent method not available",
      );

    // Enable scroll. Check if the content does overflow the box later.
    const contentBox = win.document.getAnonymousNodes(
      win.document.getElementById(id),
    )[0] as XUL.Box;
    contentBox.style.overflowY = "scroll";
    contentBox.style.height = "440px";
    // Resize window, otherwise the new prefpane may be placed out of the window
    win.sizeToContent();
    // Disable scroll if the content does not overflow.
    if (contentBox.scrollHeight === contentBox.clientHeight) {
      contentBox.style.overflowY = "hidden";
    }
  }

  async #fetchPrefXHTML(src: string): Promise<string> {
    const contentOrXHR = await this.app.File.getContentsAsync(src);
    return typeof contentOrXHR === "string"
      ? contentOrXHR
      : (contentOrXHR as unknown as XMLHttpRequest).response;
  }
  async #genPrefPane(
    descriptor: IPaneDescriptor,
  ): Promise<[frag: DocumentFragment, id: string]> {
    const {
      src,
      pluginID,
      label,
      id = `plugin-${this.app.Utilities.randomString()}-${new Date().getTime()}`,
      image,
      extraDTD,
      defaultNS,
    } = descriptor;

    const xhtml = `
<prefpane
  xmlns="${NS.XUL}" insertafter="zotero-prefpane-advanced"
  id="${id}" label="${label || pluginID}" ${image ? `image="${image}"` : ""}
  style="max-height: 10px; min-height: 10px;"
>
${await this.#fetchPrefXHTML(src)}
</prefpane>`;
    const frag = parseXHTML(xhtml, extraDTD, defaultNS);
    return [frag, id];
  }

  /**
   * https://github.com/windingwind/zotero-plugin-toolkit/blob/ce4b88062952b01fcf344afb18fe03176ac58719/src/managers/preferencePane.ts
   * implement Zotero 7 style of perference value binding in Zotero 6
   * @see https://zotero.org/support/dev/zotero_7_for_developers#preference_tags_and_preference_binding
   * Zotero 6 will emit `preference is null` error when default `<preferences>` bindings kick in, which is expected
   */
  #initPrefValBindings(container: Element) {
    const _observerSymbols = new WeakMap();
    const window = (container as any).ownerGlobal as typeof globalThis,
      self = this;

    // Activate `preference` attributes
    for (const elem of container.querySelectorAll("[preference]")) {
      let preference = elem.getAttribute("preference");
      if (!preference) {
        const legacyPref = container.querySelector(
          `preferences > preference#${preference}`,
        );
        if (legacyPref) {
          this.app.log(
            "<preference> is deprecated -- `preference` attribute values should be full preference keys, not <preference> IDs",
          );
          preference = legacyPref.getAttribute("name")!;
        }
      }
      if (!preference) continue;

      attachToPreference(elem);

      const _pref = preference;
      // defer so the pane can add listeners first
      queueMicrotask(() => {
        onPrefUpdate(elem, _pref);
      });
    }

    const obs = new window.MutationObserver((mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type == "attributes") {
          const target = mutation.target as Element;
          detachFromPreference(target);
          attachToPreference(target);
        } else if (mutation.type == "childList") {
          mutation.removedNodes.forEach(detachFromPreference);
          mutation.addedNodes.forEach(attachToPreference);
        }
      }
    });
    obs.observe(container, {
      childList: true,
      subtree: true,
      attributeFilter: ["preference"],
    });
    // parseXULToFragment() doesn't convert oncommand attributes into actual
    // listeners, so we'll do it here
    for (const elem of container.querySelectorAll("[oncommand]")) {
      (elem as any).oncommand = elem.getAttribute("oncommand");
    }

    for (const child of container.children) {
      child.dispatchEvent(new window.Event("load"));
    }

    this.register(() => {
      container.remove();
      obs.disconnect();
    });

    // #region util functions
    const useChecked = (elem: Element) => {
      if (elem instanceof window.HTMLInputElement && elem.type == "checkbox")
        return elem;
      if (isXULElement(elem) && elem.tagName == "checkbox")
        return elem as XUL.Checkbox;
      return null;
    };
    const useInput = (elem: Element) => {
      if (elem instanceof window.HTMLInputElement) return elem;
      if (isXULElement(elem) && elem.tagName == "textbox")
        return elem as XUL.Textbox;
      return null;
    };
    /**
     * load preference value
     */
    function onPrefUpdate(elem: Element, preference: string) {
      const value = self.app.Prefs.get(preference, true);

      self.app.log(
        `Updating <${elem.tagName}> element to ${preference}: ${value}`,
      );

      let input;
      if ((input = useChecked(elem))) {
        input.checked = value as boolean;
      } else if ((input = useInput(elem))) {
        input.value = value as string;
      } else return;
      elem.dispatchEvent(new window.Event("syncfrompreference"));
    }
    /**
     * save preference value
     */
    function onInput(event: Event) {
      const targetNode = event.currentTarget as Element | null;
      if (!targetNode) return;
      const preference = targetNode.getAttribute("preference");
      if (!preference) return;
      const value =
        useChecked(targetNode)?.checked ?? useInput(targetNode)?.value;
      if (value === undefined) return;

      self.app.log(
        `Updating ${preference} to <${targetNode.tagName}> element: ${value}`,
      );

      self.app.Prefs.set(preference, value, true);
      targetNode.dispatchEvent(new window.Event("synctopreference"));
    }

    function attachToPreference(elem: Node) {
      if (!(elem instanceof window.Element)) return;
      const preference = elem.getAttribute("preference");
      if (!preference) return;
      self.app.debug(`Attaching <${elem.tagName}> element to ${preference}`);
      const symbol = self.app.Prefs.registerObserver(
        preference,
        () => onPrefUpdate(elem, preference),
        true,
      );
      elem.addEventListener(isXULElement(elem) ? "command" : "input", onInput);
      _observerSymbols.set(elem, symbol);
    }

    function detachFromPreference(elem: Node) {
      if (!(elem instanceof window.Element)) return;
      if (!_observerSymbols.has(elem)) return;
      self.app.debug(`Detaching <${elem.tagName}> element from preference`);
      self.app.Prefs.unregisterObserver(_observerSymbols.get(elem));
      elem.removeEventListener(
        isXULElement(elem) ? "command" : "input",
        onInput,
      );
      _observerSymbols.delete(elem);
    }
    // #endregion
  }
  public onunload(): void {
    return;
  }
}
