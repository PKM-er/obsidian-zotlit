import "obsidian";

import { ClickNotice } from "../utils/click-notice.js";
import type ZoteroPlugin from "../zt-main.js";

declare module "obsidian" {
  interface App {
    setting: {
      open(): void;
      openTabById(id: string): never;
    };
  }
}

export default class NoticeBBTStatus extends ClickNotice {
  constructor(plugin: ZoteroPlugin) {
    super(
      (frag: DocumentFragment) => {
        frag.createSpan({
          text:
            "Failed to open Better BibTeX database. " +
            "Go to the Setting Tab to select new Better BibTeX database path. ",
        });
        frag.createSpan({
          text: "If you don't use Better BibTeX, you can disable it",
        });
        frag
          .createEl(
            "button",
            { text: "Go to the Setting Tab" },
            (btn) => (btn.style.cursor = "pointer"),
          )
          .addEventListener("click", () => {
            app.setting.open();
            app.setting.openTabById(plugin.manifest.id);
          });
        frag
          .createEl(
            "button",
            { text: "Disable Better BibTeX Citekeys" },
            (btn) => (btn.style.cursor = "pointer"),
          )
          .addEventListener("click", async () => {
            plugin.settings.betterBibTexDbPath = null;
            plugin.saveSettings();
            plugin.db.init();
          });
      },
      () => void 0,
      0,
    );
    this.noticeEl.style.display = "flex";
    this.noticeEl.style.flexDirection = "column";
    this.noticeEl.style.cursor = "auto";
  }
}
