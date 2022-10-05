import { constants } from "fs";
import { access } from "fs/promises";
import { dialog } from "@electron/remote";
import type { LogLevel } from "@obzt/common";
import { logLevels } from "@obzt/common";
import { assertNever } from "assert-never";
import type { DropdownComponent, TextAreaComponent } from "obsidian";
import { debounce, Notice, PluginSettingTab, Setting } from "obsidian";
import log from "@log";

import type { SettingKeyWithType } from "./settings.js";
import { getDefaultSettings } from "./settings.js";
import { promptOpenLog } from "./utils/index.js";
import type ZoteroPlugin from "./zt-main.js";

type TextAreaSize = Partial<Record<"cols" | "rows", number>>;

export class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    this.containerEl.empty();
    this.general();
    this.annotView();
    this.suggester();
    this.templates();
    this.logLevel();
  }
  general(): void {
    new Setting(this.containerEl).setHeading().setName("General");

    this.setDatabasePath("Zotero Database", "zoteroDbPath");
    this.setDatabasePath("BetterBibTex Database", "betterBibTexDbPath");
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
  setDatabasePath(name: string, key: "zoteroDbPath" | "betterBibTexDbPath") {
    let pathEl: HTMLDivElement | null = null;
    new Setting(this.containerEl)
      .setName(name)
      .then((setting) => {
        pathEl = setting.controlEl.createDiv({
          text: this.plugin.settings[key] ?? "Disabled",
        });
      })
      .addButton((btn) =>
        btn.setButtonText("select").onClick(async () => {
          const { filePaths } = await dialog.showOpenDialog({
            defaultPath: this.plugin.settings[key] ?? getDefaultSettings()[key],
            filters: [{ name: "database", extensions: ["sqlite"] }],
            properties: ["openFile"],
          });
          if (filePaths[0]) {
            this.plugin.settings[key] = filePaths[0];
            await this.plugin.saveSettings();
            await this.plugin.db.init();
            pathEl?.setText(filePaths[0]);
            new Notice("Zotero database path updated.");
          }
        }),
      );
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
