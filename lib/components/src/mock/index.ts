/* eslint-disable no-var */
import { createStore } from "zustand";
import type { AnnotsViewContextType, AnnotsViewStore } from "../components";
import data from "./data.json";
export const store = createStore<AnnotsViewStore>((set) => ({
  ...(data as unknown as AnnotsViewStore),
  setActiveAtch(id) {
    console.log("setActiveAtch", id);
  },
  async loadDocItem(file, lib, force) {
    console.log("loadDocItem", file, lib, force);
  },
  async refresh() {
    console.log("refresh");
  },
}));

declare global {
  var triggerCssChange: (() => void) | undefined;
  var triggerDbUpdate: (() => void) | undefined;
}

const icon = (() => {
  const template = document.createElement("template");
  template.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-hash">
<line x1="4" y1="9" x2="20" y2="9"></line>
<line x1="4" y1="15" x2="20" y2="15"></line>
<line x1="10" y1="3" x2="8" y2="21"></line>
<line x1="16" y1="3" x2="14" y2="21"></line>
</svg>`;
  return template.content.firstElementChild as SVGSVGElement;
})();

export const context: AnnotsViewContextType = {
  store,
  sanitize: (html) => html,
  registerDbUpdate(callback) {
    window.triggerDbUpdate = callback;
    return () => {
      delete window.triggerDbUpdate;
    };
  },
  refreshConn: async () => {
    window.triggerDbUpdate?.();
  },
  setIcon(parent, _iconId) {
    const n = parent.firstChild;
    if (
      !((n && n instanceof SVGSVGElement) /* && n.classList.contains(iconId) */)
    ) {
      n && parent.removeChild(n);
      const i = icon.cloneNode(true);
      i && parent.appendChild(i);
    }
  },
  onMoreOptions: (annot) => {
    console.log("onMoreOptions", annot);
  },
  onDragStart: (evt, render) => {
    console.log("onDragStart", render());
  },
  onShowDetails: (itemId) => {
    console.log("onShowDetails", itemId);
  },
  annotRenderer: {
    storeSelector: (state) => ({}),
    get(annot, prop) {
      return () => "some text";
    },
  },
  getImgSrc: (src) =>
    "https://upload.wikimedia.org/wikipedia/commons/1/14/Demo.jpg",
};
