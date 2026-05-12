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
interface VirtualPopup {
  virtual: true;
}
const isSelector = (popup: PopupSelector | PopupEl): popup is PopupSelector =>
  typeof (popup as PopupSelector).selector === "string";
const isVirtual = (
  popup: PopupSelector | PopupEl | VirtualPopup,
): popup is VirtualPopup => (popup as VirtualPopup).virtual === true;

export interface VirtualMenuItemNode {
  type: "item";
  item: MenuItem;
}

export interface VirtualMenuSubmenuNode {
  type: "submenu";
  label: string;
  menu: Menu;
}

export interface VirtualMenuSeparatorNode {
  type: "separator";
}

export type VirtualMenuNode =
  | VirtualMenuItemNode
  | VirtualMenuSubmenuNode
  | VirtualMenuSeparatorNode;

/**
 * @public
 */
export class Menu extends Component {
  dom!: XUL.MenuPopup;
  readonly removeSelf: boolean;
  readonly mode: "dom" | "virtual";
  readonly nodes: VirtualMenuNode[] = [];
  constructor(menuPopup: PopupSelector | PopupEl | VirtualPopup, parent?: Menu) {
    super();
    this.parentMenu = parent;
    if (isVirtual(menuPopup)) {
      this.mode = "virtual";
      this.removeSelf = false;
    } else if (!isSelector(menuPopup)) {
      this.mode = "dom";
      this.dom = menuPopup.element;
      this.removeSelf = menuPopup.removeSelf ?? true;
    } else {
      this.mode = "dom";
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

    if (this.mode === "dom" && !this.dom) {
      throw new Error(`Menu not found: ${menuPopup}`);
    }
  }

  static virtual(parent?: Menu) {
    return new Menu({ virtual: true }, parent);
  }

  addItem(
    cb: (item: MenuItem) => any,
    insertBefore = false,
    anchor?: XUL.Element,
  ): this {
    const item = this.addChild(new MenuItem(this));
    cb(item);

    if (this.mode === "dom") {
      this.insert(item.dom!, insertBefore, anchor);
    } else {
      this.nodes.push({ type: "item", item });
    }
    return this;
  }

  private insert(el: Element, insertBefore: boolean, anchor?: Element) {
    if (anchor) {
      anchor.insertAdjacentElement(
        insertBefore ? "beforebegin" : "afterend",
        el,
      );
    } else {
      this.dom.insertAdjacentElement(
        insertBefore ? "afterbegin" : "beforeend",
        el,
      );
    }
  }

  parentMenu?: Menu;
  addSubmenu(
    label: string,
    cb: (item: Menu) => any,
    insertBefore = false,
    anchor?: XUL.Element,
  ): this {
    if (this.mode === "virtual") {
      const submenu = this.addChild(Menu.virtual(this));
      cb(submenu);
      this.nodes.push({ type: "submenu", label, menu: submenu });
      return this;
    }
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
    if (this.mode === "virtual") {
      this.nodes.push({ type: "separator" });
      return this;
    }
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
    this.removeSelf && this.dom?.remove();
  }
}
