import type { Menu, VirtualMenuNode } from "./menu.js";

type MenuManagerContext = {
  setVisible?: (visible: boolean) => void;
  setEnabled?: (enabled: boolean) => void;
  [key: string]: unknown;
};

type ReaderContextEvent = {
  append: (entry: Record<string, unknown>) => void;
};

const menuTargets = {
  menuFile: "main/menubar/file",
  menuEdit: "main/menubar/edit",
  menuView: "main/menubar/view",
  menuGo: "main/menubar/go",
  menuTools: "main/menubar/tools",
  menuHelp: "main/menubar/help",
  collection: "main/library/collection",
  item: "main/library/item",
} as const;

export function resolveMenuTarget(selector: string) {
  return menuTargets[selector as keyof typeof menuTargets] ?? null;
}

function applyItemState(node: VirtualMenuNode, context?: MenuManagerContext) {
  if (node.type !== "item") return;
  node.item.runShowingCallbacks();
  context?.setVisible?.(!node.item.hidden);
  context?.setEnabled?.(!node.item.disabled);
}

function toMenuManagerEntry(
  node: VirtualMenuNode,
): Record<string, unknown> | null {
  if (node.type === "separator") {
    return { menuType: "separator" };
  }
  if (node.type === "submenu") {
    return {
      menuType: "submenu",
      label: node.label,
      menus: node.menu.nodes
        .map((child) => toMenuManagerEntry(child))
        .filter(Boolean),
    };
  }
  return {
    menuType: "menuitem",
    label: node.item.title,
    icon: node.item.icon ?? undefined,
    onShowing: (event: Event, context: MenuManagerContext) => {
      void event;
      applyItemState(node, context);
    },
    onCommand: (event: MouseEvent | KeyboardEvent, context: MenuManagerContext) => {
      void context;
      applyItemState(node);
      if (node.item.hidden || node.item.disabled) return;
      node.item.runCommand(event);
    },
  };
}

export function registerWithMenuManager(
  app: typeof Zotero,
  pluginID: string,
  selector: string,
  menu: Menu,
) {
  const target = resolveMenuTarget(selector);
  if (!target || !("MenuManager" in app) || !app.MenuManager) {
    return null;
  }
  const menuID = app.MenuManager.registerMenu({
    menuID: `${pluginID}-${selector}-${app.Utilities.randomString()}`,
    pluginID,
    target,
    menus: menu.nodes.map((node) => toMenuManagerEntry(node)).filter(Boolean),
  });
  return () => app.MenuManager.unregisterMenu(menuID);
}

function toReaderEntries(node: VirtualMenuNode): Record<string, unknown>[] {
  if (node.type === "separator") {
    return [{ type: "separator" }];
  }
  if (node.type === "submenu") {
    return node.menu.nodes.flatMap((child) => toReaderEntries(child));
  }
  return [
    {
      label: node.item.title,
      disabled: node.item.disabled,
      onCommand: (event: MouseEvent | KeyboardEvent) => {
        node.item.runShowingCallbacks();
        if (node.item.hidden || node.item.disabled) return;
        node.item.runCommand(event);
      },
    },
  ];
}

export function appendReaderMenu(event: ReaderContextEvent, menu: Menu) {
  for (const node of menu.nodes) {
    node.type === "item" && node.item.runShowingCallbacks();
    if (node.type === "item" && node.item.hidden) continue;
    for (const entry of toReaderEntries(node)) {
      event.append(entry);
    }
  }
}
