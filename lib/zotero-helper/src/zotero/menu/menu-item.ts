import { createXULElement } from "../helper.js";
import { Component } from "../misc.js";
import type { Menu } from "./menu.js";

declare global {
  interface HTMLElementEventMap {
    command: MouseEvent | KeyboardEvent;
    popupshowing: MouseEvent | KeyboardEvent;
  }
}

/**
 * @public
 */
export class MenuItem extends Component {
  /**
   * Private constructor. Use {@link Menu.addItem} instead.
   * @public
   */
  constructor(private menu: Menu) {
    super();
    if (menu.mode === "dom") {
      this.dom = createXULElement(
        menu.dom.ownerDocument,
        "menuitem",
      ) as XUL.MenuItem;
    }
  }
  dom?: XUL.MenuItem;
  #title = "";
  #icon: string | null = null;
  #disabled = false;
  #hidden = false;
  #onClick?: (evt: MouseEvent | KeyboardEvent) => any;
  #onShowing: Array<(item: this) => any> = [];

  get title() {
    return this.#title;
  }

  get icon() {
    return this.#icon;
  }

  get disabled() {
    return this.#disabled;
  }

  get hidden() {
    return this.#hidden;
  }

  runShowingCallbacks() {
    this.#onShowing.forEach((callback) => callback(this));
  }

  runCommand(event: MouseEvent | KeyboardEvent) {
    return this.#onClick?.(event);
  }
  /**
   * @public
   */
  setTitle(title: string): this {
    this.#title = title;
    // set label attribute directly not working in Zotero 6
    // have to use setAttribute
    this.dom?.setAttribute("label", title);
    return this;
  }
  /**
   * @public
   * @param url - data-uri or resource url to an image. If `null`, the icon is removed.
   */
  setIcon(url: string | null): this {
    this.#icon = url;
    this.dom?.classList.toggle("menuitem-iconic", url !== null);
    if (url !== null) {
      this.dom?.style.setProperty("list-style-image", `url("${url}")`);
    } else {
      this.dom?.style.removeProperty("list-style-image");
    }
    return this;
  }

  /**
   * @public
   */
  setDisabled(disabled: boolean): this {
    this.#disabled = disabled;
    if (this.dom) {
      this.dom.disabled = disabled;
    }
    return this;
  }

  show(): this {
    return this.toggle(true);
  }
  hide(): this {
    return this.toggle(false);
  }
  toggle(show: boolean): this {
    this.#hidden = !show;
    this.dom?.setAttribute("hidden", show ? "false" : "true");
    return this;
  }

  /**
   * @public
   */
  onClick(callback: (evt: MouseEvent | KeyboardEvent) => any): this {
    this.#onClick = callback;
    if (this.dom) {
      this.registerDomEvent(this.dom, "command", callback);
    }
    return this;
  }

  onShowing(callback: (item: this) => any): this {
    this.#onShowing.push(callback);
    callback(this);
    if (this.menu.mode === "dom") {
      this.registerDomEvent(this.menu.dom, "popupshowing", () => callback(this));
    }
    return this;
  }

  public onload(): void {
    return;
  }
  public onunload(): void {
    this.dom?.remove();
  }
}
