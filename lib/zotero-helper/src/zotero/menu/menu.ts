import { createXULElement } from "../helper.js";
import { Component } from "../misc.js";
import { MenuItem } from "./menu-item.js";

export enum MenuSelector {
  menuFile = "#menu_FilePopup",
  menuEdit = "#menu_EditPopup",
  menuView = "#menu_viewPopup",
  menuGo = "#menu_goPopup",
  menuTools = "#menu_ToolsPopup",
  menuHelp = "#menu_HelpPopup",
  collection = "#zotero-collectionmenu",
  item = "#zotero-itemmenu",
  reader = -1,
}

interface PopupSelector {
  selector: keyof typeof MenuSelector | string;
}
interface PopupEl {
  element: XUL.MenuPopup;
  /** whether remove given element when unload, default to true */
  removeSelf?: boolean;
}
const isSelector = (popup: PopupSelector | PopupEl): popup is PopupSelector =>
  (popup as PopupSelector).selector !== undefined;

/**
 * @public
 */
export class Menu extends Component {
  dom: XUL.MenuPopup;
  readonly removeSelf: boolean;
  constructor(menuPopup: PopupSelector | PopupEl, parent?: Menu) {
    super();
    this.parentMenu = parent;
    if (!isSelector(menuPopup)) {
      this.dom = menuPopup.element;
      this.removeSelf = menuPopup.removeSelf ?? true;
    } else {
      let selector: string | -1 | undefined =
        MenuSelector[menuPopup.selector as keyof typeof MenuSelector];
      if (selector === -1) {
        throw new Error(`Menu can't handle ${menuPopup} directly`);
      }
      if (!selector) {
        // use custom selector passed in
        selector = menuPopup.selector;
      }
      this.dom = mainDocument.querySelector(selector) as XUL.MenuPopup;
      this.removeSelf = false;
    }

    if (!this.dom) {
      throw new Error(`Menu not found: ${menuPopup}`);
    }
  }

  addItem(
    cb: (item: MenuItem) => any,
    insertBefore = false,
    anchor?: XUL.Element,
  ): this {
    const item = this.addChild(new MenuItem(this));
    cb(item);

    this.insert(item.dom, insertBefore, anchor);
    return this;
  }

  private insert(el: Element, insertBefore: boolean, anchor?: Element) {
    (anchor || this.dom).insertAdjacentElement(
      insertBefore ? "beforebegin" : "afterend",
      el,
    );
  }

  parentMenu?: Menu;
  addSubmenu(
    label: string,
    cb: (item: Menu) => any,
    insertBefore = false,
    anchor?: XUL.Element,
  ): this {
    const submenuEl = createXULElement(
      this.dom.ownerDocument,
      "menu",
    ) as XUL.Menu;
    const popupEl = createXULElement(
      this.dom.ownerDocument,
      "menupopup",
    ) as XUL.MenuPopup;

    submenuEl.appendChild(popupEl);
    submenuEl.setAttribute("label", label);

    this.register(() => submenuEl.remove());
    const submenu = this.addChild(new Menu({ element: popupEl }, this));
    cb(submenu);
    this.insert(submenuEl, insertBefore, anchor);
    return this;
  }

  onShowing(callback: (evt: MouseEvent | KeyboardEvent) => any): this {
    this.registerDomEvent(this.dom, "popupshowing", callback);
    return this;
  }

  /**
   * Adds a separator
   * @public
   */
  addSeparator(insertBefore = false, anchor?: XUL.Element): this {
    const separatorEl = createXULElement(
      this.dom.ownerDocument,
      "menuseparator",
    );
    this.insert(separatorEl, insertBefore, anchor);
    this.register(() => separatorEl.remove());
    return this;
  }
  public onload(): void {
    return;
  }
  public onunload(): void {
    this.removeSelf && this.dom.remove();
  }
}
