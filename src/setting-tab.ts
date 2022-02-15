import assertNever from "assert-never";
import { promises as fs } from "fs";
import { LogLevelNumbers } from "loglevel";
import {
  debounce,
  Notice,
  PluginSettingTab,
  Setting,
  TextAreaComponent,
} from "obsidian";
import path from "path";

import { promptOpenLog } from "./utils";
import log from "./utils/logger";
import ZoteroPlugin from "./zt-main";

export class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    this.general();
    this.templates();
    this.logLevel();
  }
  general(): void {
    let pathBox: TextAreaComponent;
    new Setting(this.containerEl).setHeading().setName("General");
    new Setting(this.containerEl)
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
    new Setting(this.containerEl)
      .setName("Literature Note Folder")
      .addText((text) => {
        const onChange = async (value: string) => {
          const noteFolder = this.plugin.settings.literatureNoteFolder;
          noteFolder.path = value;
          if (noteFolder.path !== value) text.setValue(noteFolder.path);
          this.plugin.zoteroItems.noteFolder = noteFolder.path;
          await this.plugin.saveSettings();
        };
        text
          .setValue(this.plugin.settings.literatureNoteFolder.path)
          .onChange(debounce(onChange, 1e3, true));
      });
  }
  templates(): void {
    new Setting(this.containerEl).setHeading().setName("Templates");
    const template = this.plugin.settings.literatureNoteTemplate;
    for (const key of template.getAllTemplatePropNames()) {
      let title: string,
        desc: string | DocumentFragment = "";
      switch (key) {
        case "content":
          title = "Note Content";
          break;
        case "filename":
          title = "Note Filename";
          break;
        case "annotation":
          title = "Annotation";
          break;
        case "annots":
          title = "Annotations";
          break;
        default:
          assertNever(key);
      }
      const setting = this.addTextField(
        this.containerEl,
        () => template[key],
        (value) => (template[key] = value),
      ).setName(title);
      if (desc) setting.setDesc(desc);
    }
  }
  logLevel = () => {
    new Setting(this.containerEl).setHeading().setName("Debug");
    new Setting(this.containerEl)
      .setName("Log Level")
      .setDesc(
        createFragment((frag) => {
          frag.appendText("Change level of logs output to the console.");
          frag.createEl("br");
          frag.appendText("Set to DEBUG if debug is required");
          frag.createEl("br");
          frag.appendText("To check console, " + promptOpenLog());
        }),
      )
      .addDropdown((dp) =>
        dp
          .then((dp) =>
            Object.entries(log.levels).forEach(([key, val]) =>
              dp.addOption(val.toString(), key),
            ),
          )
          .setValue(log.getLevel().toString())
          .onChange(async (val) => {
            const level = +val as LogLevelNumbers;
            log.setLevel(level);
            this.plugin.settings.logLevel = level;
            await this.plugin.saveSettings();
          }),
      );
  };

  addTextField(
    addTo: HTMLElement,
    get: () => string,
    set: (value: string) => void,
    timeout = 500,
  ): Setting {
    return new Setting(addTo).addTextArea((text) => {
      const onChange = async (value: string) => {
        set(value);
        await this.plugin.saveSettings();
      };
      text.setValue(get()).onChange(debounce(onChange, timeout, true));
      text.inputEl.cols = 30;
      text.inputEl.rows = 5;
    });
  }
}
