import assertNever from "assert-never";
import { promises as fs } from "fs";
import { LogLevelNumbers } from "loglevel";
import {
  debounce,
  DropdownComponent,
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
    new Setting(this.containerEl).setHeading().setName("General");

    this.setZoteroDbPath();
    this.setLiteratureNoteFolder();
    this.setCitationLibrary();
  }
  setLiteratureNoteFolder() {
    const setter = async (value: string, text: TextAreaComponent) => {
      const { literatureNoteFolder: noteFolder } = this.plugin.settings;
      noteFolder.path = value;
      // correct with normalized path
      if (noteFolder.path !== value) text.setValue(noteFolder.path);
      // update note index
      this.plugin.noteIndex.noteFolder = noteFolder.path;
      await this.plugin.saveSettings();
    };
    this.addTextComfirm(
      this.containerEl,
      () => this.plugin.settings.literatureNoteFolder.path,
      setter,
      { rows: 1 },
    ).setName("Literature Note Folder");
  }
  setZoteroDbPath() {
    const setter = async (value: string) => {
      const newPath = value;
      if (newPath === this.plugin.settings.zoteroDbPath) {
        new Notice("Zotero database path not changed");
      } else
        try {
          const stats = await fs.stat(newPath);
          if (!stats.isFile()) {
            new Notice("Exception: Given path must be a file.");
          } else if (path.extname(newPath) !== ".sqlite") {
            new Notice("Exception: Given path must be a .sqlite database.");
          } else {
            this.plugin.settings.zoteroDbPath = newPath;
            await this.plugin.saveSettings();
            await this.plugin.db.refreshIndex();
            new Notice("Zotero database path updated.");
          }
        } catch (error) {
          new Notice((error as NodeJS.ErrnoException).toString());
        }
    };
    this.addTextComfirm(
      this.containerEl,
      () => this.plugin.settings.zoteroDbPath,
      setter,
      { cols: 30 },
    ).setName("Zotero Database Path");
  }
  setCitationLibrary() {
    let dropdown: DropdownComponent | null = null;
    const renderDropdown = async (s: Setting, refresh = false) => {
      dropdown && dropdown.selectEl.remove();
      const libs = await this.plugin.db.getLibs(refresh);
      s.addDropdown((dd) => {
        dropdown = dd;
        for (const { libraryID, name } of libs) {
          dd.addOption(libraryID.toString(), name);
        }
        dd.setValue(this.plugin.settings.citationLibrary.toString()).onChange(
          async (val) => {
            const level = +val;
            this.plugin.settings.citationLibrary = level;
            await this.plugin.db.refreshIndex();
            new Notice("Zotero database updated.");
            await this.plugin.saveSettings();
          },
        );
      });
    };
    const setting: Setting = new Setting(this.containerEl)
      .setName("Citation Library")
      .addButton((cb) =>
        cb
          .setIcon("switch")
          .setTooltip("Refresh")
          .onClick(() => renderDropdown(setting, true)),
      )
      .then(renderDropdown);
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
  addTextComfirm(
    addTo: HTMLElement,
    get: () => string,
    set: (value: string, text: TextAreaComponent) => any,
    size: Partial<Record<"cols" | "rows", number>> = {},
  ) {
    let component: TextAreaComponent;
    return new Setting(addTo)
      .addTextArea((txt) => {
        component = txt;
        txt.setValue(get());
        Object.assign(txt.inputEl, size);
      })
      .addButton((btn) =>
        btn
          .setIcon("checkmark")
          .setTooltip("Apply")
          .onClick(() => set(component.getValue(), component)),
      );
  }
}
