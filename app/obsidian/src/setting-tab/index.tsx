import "./styles.less";

import { constants } from "fs";
import { access } from "fs/promises";
import type { LogLevel } from "@obzt/common";
import { logLevels } from "@obzt/common";
import { assertNever } from "assert-never";
import { around } from "monkey-around";
import type {
  DropdownComponent,
  ExtraButtonComponent,
  TextAreaComponent,
} from "obsidian";
import { debounce, Notice, PluginSettingTab, Setting } from "obsidian";
import ReactDOM from "react-dom";
import log from "@log";

import type { SettingKeyWithType } from "../settings.js";
import { TEMPLATE_NAMES } from "../template";
import { EJECTABLE_TEMPLATE_NAMES } from "../template/defaults";
import { enableBracketExtension } from "../template/editor";
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
    this.setImgExcerptFolder();
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
    // this.setMutool();
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

  setImgExcerptFolder() {
    const setVisible = (enabled: boolean) => {
      const el = text.settingEl;
      if (enabled) {
        el.style.removeProperty("display");
      } else {
        el.style.setProperty("display", "none");
      }
    };
    this.addToggle(this.containerEl, "symlinkImgExcerpt", setVisible).setName(
      "Symlink Image Excerpt",
    );
    const setter = async (value: string, text: TextAreaComponent) => {
      const { imgExcerptPath } = this.plugin.settings;
      imgExcerptPath.path = value;
      // correct with normalized path
      if (imgExcerptPath.path !== value) text.setValue(imgExcerptPath.path);
      await this.plugin.saveSettings();
    };
    const text = this.addTextComfirm(
      this.containerEl,
      () => this.plugin.settings.imgExcerptPath.path,
      setter,
      { rows: 1 },
    ).setName("Image Excerpts Folder");
    setVisible(this.plugin.settings.symlinkImgExcerpt);
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
    const { template } = this.plugin.settings;

    new Setting(this.containerEl).setHeading().setName("Templates");
    // template folder
    this.addTextComfirm(
      this.containerEl,
      () => template.folder.path,
      async (value: string, text: TextAreaComponent) => {
        template.folder.path = value;
        // correct with normalized path
        if (template.folder.path !== value) text.setValue(template.folder.path);
        await this.plugin.saveSettings();
      },
      { rows: 1 },
    )
      .setName("Template Folder")
      .setDesc("The folder which templates are ejected into and stored");
    this.addToggle(this.containerEl, "autoPairEta", (val) => {
      this.plugin.editorExtensions.length = 0;
      if (val) {
        enableBracketExtension(this.plugin);
      }
      app.workspace.updateOptions();
    })
      .setName("Auto Pair For Eta")
      .setDesc(
        createFragment((c) => {
          c.createDiv({
            text: "Pair `<` and `%` automatically in eta templates.",
          });
          c.createDiv({
            text: "If you have issue with native auto pair features, you can disable this option and report the bug in GitHub",
          });
        }),
      );
    new Setting(this.containerEl).setHeading().setName("Simple");
    for (const key of TEMPLATE_NAMES) {
      let title: string;
      const desc: string | DocumentFragment = "";
      switch (key) {
        case "filename":
          title = "Note Filename";
          break;
        case "citation":
          title = "Markdown primary citation template";
          break;
        case "altCitation":
          title = "Markdown secondary citation template";
          break;
        default:
          continue;
      }
      const setting = this.addTextField(
        this.containerEl,
        () => template.getTemplate(key),
        (value) => template.complie(key, value),
        { rows: 2 },
      ).setName(title);
      if (desc) setting.setDesc(desc);
    }
    let ejectButton: ExtraButtonComponent = {} as never;
    const setting = new Setting(this.containerEl)
      .setHeading()
      .setName("Ejectable")
      .setDesc("These templates can be customized once ejected into vault");

    const labelEl = setting.controlEl.createDiv();
    setting.addExtraButton((btn) => {
      ejectButton = btn;
    });

    const setEjectButton = () => {
      let icon, text, desc;
      if (!template.ejected) {
        icon = "folder-input";
        text = "Eject";
        desc = "Eject templates into vault";
      } else {
        icon = "x-circle";
        text = "Revert";
        desc = "Revert templates to default";
      }
      ejectButton.setIcon(icon).setTooltip(desc);
      labelEl.setText(text);
    };
    setEjectButton();
    ejectButton.onClick(async () => {
      template.ejected = !template.ejected;
      await this.plugin.saveSettings();
      await template.loadAll();
      setEjectButton();
      this.setEjectableTemplates(ejectableContainer);
    });

    const ejectableContainer = this.containerEl.createDiv();
    this.setEjectableTemplates(ejectableContainer);
  }
  setEjectableTemplates(container: HTMLElement) {
    container.empty();
    const { template } = this.plugin.settings;
    for (const name of EJECTABLE_TEMPLATE_NAMES) {
      let title,
        desc: string | DocumentFragment = "";
      switch (name) {
        case "note":
          title = "Note Content";
          desc = "Used to render created literature note";
          break;
        case "annotation":
          title = "Annotaion";
          desc = "Used to render single annotation";
          break;
        case "annots":
          title = "Annotations";
          desc = "Used to render annotation list when batch importing";
          break;
        default:
          assertNever(name);
      }
      if (template.ejected) {
        new Setting(container)
          .setName(name)
          .setDesc(desc)
          .then((setting) =>
            setting.controlEl.createDiv("", (el) => {
              el.createEl("code", { text: template.getTemplateFile(name) });
            }),
          )
          .addButton((btn) =>
            btn
              .setIcon("arrow-up-right")
              .setTooltip("Open Template File")
              .onClick(async () => {
                if (!template.ejected) {
                  new Notice("Cannot open file, templates are not ejected");
                  return;
                }
                await app.workspace.openLinkText(
                  template.getTemplateFile(name),
                  "",
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (this as any).setting.close();
              }),
          );
      } else {
        this.addTextField(
          container,
          () => template.getTemplate(name),
          (value) => template.complie(name, value),
        )
          .setName(title)
          .setDesc(desc)
          .setDisabled(true);
      }
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
