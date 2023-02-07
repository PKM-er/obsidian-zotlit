/* eslint-disable no-var */
import { createStore } from "zustand";
import type { AnnotViewContextType, AnnotViewStore } from "../components";
import type { ObsidianContextType } from "../components/obsidian";
import data from "./data.json";
export const store = createStore<AnnotViewStore>((set) => ({
  ...(data as unknown as AnnotViewStore),
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

export const annotViewCtx: AnnotViewContextType = {
  store,
  registerDbUpdate(callback) {
    window.triggerDbUpdate = callback;
    return () => {
      delete window.triggerDbUpdate;
    };
  },
  refreshConn: async () => {
    window.triggerDbUpdate?.();
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

export const context: ObsidianContextType = {
  sanitize: (html) => html,

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
};
