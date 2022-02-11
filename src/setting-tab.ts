import { promises as fs } from "fs";
import {
  debounce,
  normalizePath,
  Notice,
  PluginSettingTab,
  Setting,
  TextAreaComponent,
} from "obsidian";
import path from "path";

import ZoteroPlugin from "./zt-main";

export class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    let pathBox: TextAreaComponent;
    new Setting(containerEl)
      .setName("Zotero Database Path")
      .addTextArea(
        (txt) => (
          (pathBox = txt), txt.setValue(this.plugin.settings.zoteroDbPath)
        ),
      )
      .addButton((btn) =>
        btn
          .setIcon("checkmark")
          .setTooltip("Apply")
          .onClick(async () => {
            const newPath = pathBox.getValue();
            if (newPath === this.plugin.settings.zoteroDbPath) {
              new Notice("Zotero database path not changed");
            } else
              try {
                const stats = await fs.stat(newPath);
                if (!stats.isFile()) {
                  new Notice("Exception: Given path must be a file.");
                } else if (path.extname(newPath) !== ".sqlite") {
                  new Notice(
                    "Exception: Given path must be a .sqlite database.",
                  );
                } else {
                  this.plugin.settings.zoteroDbPath = newPath;
                  await this.plugin.saveSettings();
                  await this.plugin.db.refresh();
                  new Notice("Zotero database path updated.");
                }
              } catch (error) {
                new Notice((error as NodeJS.ErrnoException).toString());
              }
          }),
      );
    new Setting(containerEl)
      .setName("Literature Note Folder")
      .addText((text) => {
        const onChange = async (value: string) => {
          const normalized = normalizePath(value);
          if (normalized !== value) text.setValue(normalized);
          this.plugin.settings.literatureNoteFolder = normalized;
          await this.plugin.saveSettings();
        };
        text
          .setValue(this.plugin.settings.literatureNoteFolder)
          .onChange(debounce(onChange, 500, true));
      });
  }
}
