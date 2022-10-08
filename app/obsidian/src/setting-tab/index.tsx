import "./styles.less";

import { constants } from "fs";
import { access } from "fs/promises";
import type { LogLevel } from "@obzt/common";
import { logLevels } from "@obzt/common";
import { assertNever } from "assert-never";
import { around } from "monkey-around";
import type { DropdownComponent, TextAreaComponent } from "obsidian";
import { debounce, Notice, PluginSettingTab, Setting } from "obsidian";
import ReactDOM from "react-dom";
import log from "@log";

import type { SettingKeyWithType } from "../settings.js";
import { promptOpenLog } from "../utils/index.js";
import type ZoteroPlugin from "../zt-main.js";
import { DatabaseSetting } from "./database-path.js";

type TextAreaSize = Partial<Record<"cols" | "rows", number>>;

export class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const tab = this;
    const unloadPatch = around(this.containerEl, {
      empty: (next) =>
        function (this: HTMLElement) {
          tab.unmountDataDirSetting?.();
          next.call(this);
          unloadPatch();
        },
    });
    this.general();
    this.annotView();
    this.suggester();
    this.templates();
    this.logLevel();
  }
  general(): void {
    new Setting(this.containerEl).setHeading().setName("General");

    this.setDataDirPath();
    this.addToggle(this.containerEl, "autoRefresh", (val) =>
      this.plugin.db.setAutoRefresh(val),
    ).setName("Refresh automatically when Zotero updates database");

    this.setLiteratureNoteFolder();
    this.setCitationLibrary();
  }
  suggester(): void {
    new Setting(this.containerEl).setHeading().setName("Suggester");
    this.addToggle(this.containerEl, "citationEditorSuggester").setName(
      "Citation Editor Suggester",
    );
    this.addToggle(this.containerEl, "showCitekeyInSuggester").setName(
      "Show BibTex Citekey in Suggester",
    );
  }
  annotView(): void {
    new Setting(this.containerEl).setHeading().setName("Annotaion View");
    this.setMutool();
  }
  setMutool() {
    this.addTextComfirm(
      this.containerEl,
      () => this.plugin.settings.mutoolPath ?? "",
      async (value: string, _text) => {
        try {
          await access(value, constants.X_OK);
          new Notice("mutool path is saved.");
          this.plugin.settings.mutoolPath = value;
          await this.plugin.saveSettings();
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            new Notice("File not found");
          } else if ((error as NodeJS.ErrnoException).code === "EACCES") {
            new Notice("File not executable");
          } else {
            throw error;
          }
        }
      },
      { rows: 1 },
    ).setName("`mutool` path");
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

  unmountDataDirSetting?: () => void;
  setDataDirPath() {
    const el = new Setting(this.containerEl).settingEl;
    ReactDOM.render(<DatabaseSetting plugin={this.plugin} />, el);
    this.unmountDataDirSetting = () => ReactDOM.unmountComponentAtNode(el);
  }
  setCitationLibrary() {
    let dropdown: DropdownComponent | null = null;
    const renderDropdown = async (s: Setting) => {
      dropdown && dropdown.selectEl.remove();
      const libs = await this.plugin.db.getLibs();
      s.addDropdown((dd) => {
        dropdown = dd;
        for (const { libraryID, type, groupID } of libs) {
          if (!libraryID) continue;
          dd.addOption(
            libraryID.toString(),
            type === "user" ? "My Library" : `Group ${groupID}`,
          );
        }
        dd.setValue(this.plugin.settings.citationLibrary.toString()).onChange(
          async (val) => {
            const level = +val;
            this.plugin.settings.citationLibrary = level;
            await this.plugin.db.initIndex();
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
          .onClick(async () => {
            await this.plugin.db.fullRefresh();
            renderDropdown(setting);
          }),
      )
      .then(renderDropdown);
  }
  templates(): void {
    new Setting(this.containerEl).setHeading().setName("Templates");
    const template = this.plugin.settings.literatureNoteTemplate;
    for (const key of template.getAllTemplatePropNames()) {
      let title: string,
        size: TextAreaSize | undefined = undefined;
      const desc: string | DocumentFragment = "";
      switch (key) {
        case "content":
          title = "Note Content";
          break;
        case "filename":
          title = "Note Filename";
          size = { rows: 2 };
          break;
        case "annotation":
          title = "Annotation";
          break;
        case "annots":
          title = "Annotations";
          break;
        case "mdCite":
          title = "Markdown primary citation template";
          size = { rows: 2 };
          break;
        case "altMdCite":
          title = "Markdown secondary citation template";
          size = { rows: 2 };
          break;
        default:
          assertNever(key);
      }
      const setting = this.addTextField(
        this.containerEl,
        () => template[key],
        (value) => (template[key] = value),
        size,
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
          .addOptions(logLevels)
          .setValue(log.level.toString())
          .onChange(async (val) => {
            const level = val as LogLevel;
            log.level = level;
            await this.plugin.db.setLoglevel(level);
            this.plugin.settings.logLevel = level;
            await this.plugin.saveSettings();
          }),
      );
  };

  addToggle(
    addTo: HTMLElement,
    key: SettingKeyWithType<boolean>,
    set?: (value: boolean) => void,
  ): Setting {
    return new Setting(addTo).addToggle((toggle) => {
      toggle.setValue(this.plugin.settings[key]).onChange((value) => {
        this.plugin.settings[key] = value;
        set?.(value);
        this.plugin.saveSettings();
      });
    });
  }
  addTextField(
    addTo: HTMLElement,
    get: () => string,
    set: (value: string) => void,
    size: TextAreaSize = {},
    timeout = 500,
  ): Setting {
    return new Setting(addTo).addTextArea((text) => {
      const onChange = async (value: string) => {
        set(value);
        await this.plugin.saveSettings();
      };
      text.setValue(get()).onChange(debounce(onChange, timeout, true));
      Object.assign(text.inputEl, { cols: 30, rows: 5, ...size });
    });
  }
  addTextComfirm(
    addTo: HTMLElement,
    get: () => string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (value: string, text: TextAreaComponent) => any,
    size: TextAreaSize = {},
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
