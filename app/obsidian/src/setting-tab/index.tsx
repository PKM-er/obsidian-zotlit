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
import log, { applyLoglevel } from "@log";

import type { SettingKeyWithType } from "../settings.js";
import { TEMPLATE_NAMES } from "../template";
import { EJECTABLE_TEMPLATE_NAMES } from "../template/defaults";
// import { enableBracketExtension } from "../template/editor";
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
    new Setting(this.containerEl)
      .addToggle((toggle) => {
        const settings = this.plugin.settings.watcher;
        toggle.setValue(settings.autoRefresh).onChange(async (value) => {
          settings.autoRefresh = value;
          await this.plugin.dbWatcher.setAutoRefresh(value);
          await this.plugin.saveSettings();
        });
      })
      .setName("Refresh automatically when Zotero updates database");

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
    new Setting(this.containerEl)
      .addToggle((toggle) => {
        const settings = this.plugin.settings.imgImporter;
        toggle.setValue(settings.symlinkImgExcerpt).onChange(async (value) => {
          settings.symlinkImgExcerpt = value;
          setVisible(value);
          await this.plugin.saveSettings();
        });
      })
      .setName("Symlink Image Excerpt");
    const settings = this.plugin.settings.imgImporter;
    const setter = async (value: string, text: TextAreaComponent) => {
      const { imgExcerptPath } = settings;
      imgExcerptPath.path = value;
      // correct with normalized path
      if (imgExcerptPath.path !== value) text.setValue(imgExcerptPath.path);
      await this.plugin.saveSettings();
    };
    const text = this.addTextComfirm(
      this.containerEl,
      () => settings.imgExcerptPath.path,
      setter,
      { rows: 1 },
    ).setName("Image Excerpts Folder");
    setVisible(settings.symlinkImgExcerpt);
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
      const libs = await this.plugin.databaseAPI.getLibs();
      s.addDropdown((dd) => {
        dropdown = dd;
        for (const { libraryID, name, groupID } of libs) {
          if (!libraryID) continue;
          dd.addOption(
            libraryID.toString(),
            name
              ? groupID
                ? `${name} (Group)`
                : name
              : `Library ${libraryID}`,
          );
        }
        const settings = this.plugin.settings.database;
        dd.setValue(settings.citationLibrary.toString()).onChange(
          async (val) => {
            const level = +val;
            settings.citationLibrary = level;
            await this.plugin.dbWorker.refresh({
              task: "searchIndex",
              force: true,
            });
            new Notice("Zotero search index updated.");
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
            await this.plugin.dbWorker.refresh({ task: "full" });
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
    // this.addToggle(this.containerEl, "autoPairEta", (val) => {
    //   this.plugin.editorExtensions.length = 0;
    //   if (val) {
    //     enableBracketExtension(this.plugin);
    //   }
    //   app.workspace.updateOptions();
    // })
    //   .setName("Auto Pair For Eta")
    //   .setDesc(
    //     createFragment((c) => {
    //       c.createDiv({
    //         text: "Pair `<` and `%` automatically in eta templates.",
    //       });
    //       c.createDiv({
    //         text: "If you have issue with native auto pair features, you can disable this option and report the bug in GitHub",
    //       });
    //     }),
    //   );
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
          frag.appendText("Set to DEBUG if you need to report a issue");
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
            this.plugin.settings.log.level = level;
            await applyLoglevel(this.plugin.databaseAPI, level);
            await this.plugin.saveSettings();
          }),
      );
  };

  addToggle(
    addTo: HTMLElement,
    key: SettingKeyWithType<boolean>,
    set?: (value: boolean) => void | Promise<void>,
  ): Setting {
    return new Setting(addTo).addToggle((toggle) => {
      toggle.setValue(this.plugin.settings[key]).onChange(async (value) => {
        this.plugin.settings[key] = value;
        await set?.(value);
        await this.plugin.saveSettings();
      });
    });
  }
  addTextField(
    addTo: HTMLElement,
    get: () => string,
    set: (value: string) => void | Promise<void>,
    size: TextAreaSize = {},
    timeout = 500,
  ): Setting {
    return new Setting(addTo).addTextArea((text) => {
      const onChange = async (value: string) => {
        await set(value);
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
