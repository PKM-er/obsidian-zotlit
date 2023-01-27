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
}

/**
 * @public
 */
export class Menu extends Component {
  dom: XUL.MenuPopup;
  removeSelf = false;
  constructor(
    menuPopup: XUL.MenuPopup | keyof typeof MenuSelector | string,
    parent?: Menu,
  ) {
    super();
    this.parentMenu = parent;
    if (typeof menuPopup !== "string") {
      this.dom = menuPopup;
      this.removeSelf = true;
    } else {
      this.dom = mainDocument.querySelector(
        MenuSelector[menuPopup as keyof typeof MenuSelector] ?? menuPopup,
      ) as XUL.MenuPopup;
    }

    if (!this.dom) {
      throw new Error(`Menu not found: ${menuPopup}`);
    }
  }

  /**
   * Adds a menu item. Only works when menu is not shown yet.
   * @public
   */
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
    const submenu = this.addChild(new Menu(popupEl, this));
    cb(submenu);
    this.insert(submenuEl, insertBefore, anchor);
    return this;
  }

  onShowing(callback: (evt: MouseEvent | KeyboardEvent) => any): this {
    this.dom.addEventListener("popupshowing", callback);
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
