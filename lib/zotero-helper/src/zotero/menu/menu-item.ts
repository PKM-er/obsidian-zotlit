import { createXULElement } from "../helper.js";
import { Component } from "../misc.js";
import { Menu } from "./menu.js";

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
    this.dom = createXULElement(
      menu.dom.ownerDocument,
      "menuitem",
    ) as XUL.MenuItem;
  }
  dom: XUL.MenuItem;
  /**
   * @public
   */
  setTitle(title: string): this {
    // set label attribute directly not working in Zotero 6
    // have to use setAttribute
    this.dom.setAttribute("label", title);
    return this;
  }
  /**
   * @public
   * @param url - data-uri or resource url to an image. If `null`, the icon is removed.
   */
  setIcon(url: string | null): this {
    this.dom.classList.toggle("menuitem-iconic", url !== null);
    if (url !== null) {
      this.dom.style.listStyleImage = `url("${url}")`;
    }
    return this;
  }

  /**
   * @public
   */
  setDisabled(disabled: boolean): this {
    this.dom.disabled = disabled;
    return this;
  }

  /**
   * @public
   */
  onClick(callback: (evt: MouseEvent | KeyboardEvent) => any): this {
    this.dom.addEventListener("command", callback);
    return this;
  }

  public onload(): void {
    return;
  }
  public onunload(): void {
    this.dom.remove();
  }
}
