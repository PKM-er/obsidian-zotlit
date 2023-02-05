import "./styles.less";

import { pipe } from "@mobily/ts-belt";
import { map } from "@mobily/ts-belt/Array";
import { fromPairs } from "@mobily/ts-belt/Dict";
import type { LogLevel } from "@obzt/common";
import { logLevels } from "@obzt/common";
import getPort from "get-port";
import { around } from "monkey-around";
import type {
  DropdownComponent,
  ExtraButtonComponent,
  TextAreaComponent,
} from "obsidian";
import { Notice, PluginSettingTab, Setting } from "obsidian";
import ReactDOM from "react-dom";

import { DatabaseSetting } from "./database-path.js";
import { addTextComfirm, addTextField, addToggle, getPipeFunc } from "./utils";
import log from "@/log";
import { InVaultPath } from "@/settings/invault-path";
import { ejectableTemplateTypes } from "@/template";
import type { TemplateType } from "@/template/settings";
import { nonEjectableTemplateTypes } from "@/template/settings";
import { promptOpenLog } from "@/utils/index.js";
import type ZoteroPlugin from "@/zt-main.js";

export class ZoteroSettingTab extends PluginSettingTab {
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app, plugin);
    this.pipe = getPipeFunc(this.plugin, this.containerEl);
  }

  // patches for life cycle
  patchUnload(): boolean {
    const tabContentContainer = this.containerEl.parentElement;
    if (!tabContentContainer) {
      throw new Error("Setting tab is not mounted");
    }
    if (
      !tabContentContainer.classList.contains("vertical-tab-content-container")
    ) {
      log.error("Failed to patch unload, unexpected tabContentContainer");
      console.error(tabContentContainer);
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const unloadPatch = around(tabContentContainer, {
      empty: (next) =>
        function (this: HTMLElement) {
          self.unload();
          next.call(this);
          unloadPatch();
        },
    });
    log.debug("Setting tab unload patched");
    return true;
  }

  #events: (() => void)[] = [];
  register(func: () => void): void {
    this.plugin.register(func);
  }
  unload(): void {
    while (this.#events.length > 0) {
      this.#events.pop()!();
    }
  }
  pipe: ReturnType<typeof getPipeFunc>;

  display(): void {
    this.containerEl.empty();
    this.patchUnload();
    this.general();
    // this.annotView();
    this.suggester();
    this.templates();
    this.server();
    this.logLevel();
  }
  general(): void {
    new Setting(this.containerEl).setHeading().setName("General");

    this.setDataDirPath();

    const { watcher, noteIndex, imgImporter } = this.plugin.settings;
    this.pipe(
      addToggle(
        () => watcher.autoRefresh,
        async (value) => {
          return await watcher.setOption("autoRefresh", value).apply();
        },
      ),
    ).setName("Refresh automatically when Zotero updates database");

    this.pipe(
      addTextComfirm(
        () => noteIndex.literatureNoteFolder,
        async (value, text) => {
          return await noteIndex
            .setOption("literatureNoteFolder", this.normalizePath(value, text))
            .apply();
        },
        { rows: 1 },
      ),
    ).setName("Literature Note Folder");

    // #region setImgExcerptFolder
    this.pipe(
      this.containerEl,
      addToggle(
        () => imgImporter.symlinkImgExcerpt,
        async (value) => {
          const isChanged = await imgImporter
            .setOption("symlinkImgExcerpt", value)
            .apply();
          isChanged && imgExcerptPath.settingEl.toggle(value);
          return isChanged;
        },
      ),
    ).setName("Symlink Image Excerpt");

    const imgExcerptPath = this.pipe(
      this.containerEl,
      addTextComfirm(
        () => imgImporter.imgExcerptPath,
        async (value, text) => {
          return await imgImporter
            .setOption("imgExcerptPath", this.normalizePath(value, text))
            .apply();
        },
        { rows: 1 },
      ),
    ).setName("Image Excerpts Folder");
    // #endregion

    this.setCitationLibrary();
  }
  suggester(): void {
    new Setting(this.containerEl).setHeading().setName("Suggester");

    const { suggester } = this.plugin.settings;
    this.pipe(
      addToggle(
        () => suggester.citationEditorSuggester,
        async (value) => {
          return await suggester
            .setOption("citationEditorSuggester", value)
            .apply();
        },
      ),
    ).setName("Citation Editor Suggester");

    this.pipe(
      addToggle(
        () => suggester.showCitekeyInSuggester,
        async (value) => {
          return await suggester
            .setOption("showCitekeyInSuggester", value)
            .apply();
        },
      ),
    ).setName("Show BibTex Citekey in Suggester");
  }
  server(): void {
    new Setting(this.containerEl).setHeading().setName("Server");

    const { server } = this.plugin.settings;
    this.pipe(
      addToggle(
        () => server.enableServer,
        async (value) => {
          portSetting.settingEl.toggle(value);
          return await server.setOption("enableServer", value).apply();
        },
      ),
    ).setName("Background Action Server");

    const portSetting = this.pipe(
      addTextComfirm(
        () => `${server.serverPort}`,
        async (value, text) => {
          let portVal = Number.parseInt(value, 10);
          if (isNaN(portVal) || portVal < 0 || portVal > 65535) {
            const defaultPort = server.getDefaults().serverPort;
            new Notice(
              "Invalid port number, revert to default value: " + defaultPort,
            );
            portVal = defaultPort;
            text.setValue(`${defaultPort}`);
          }
          if (portVal === server.serverPort) {
            // no need to save if port is not changed
            return false;
          }
          const portReady = await getPort({
            host: "127.0.0.1",
            port: [portVal],
          });
          console.log(portReady, portVal);
          if (portReady !== portVal) {
            new Notice(
              `Port is currently occupied, a different port is provided: ${portReady}, confirm again to apply the change.`,
            );
            text.setValue(`${portReady}`);
            return false;
          }
          const result = server.setOption("serverPort", portReady);
          await result.apply();
          if (result.changed) {
            new Notice("Server port is saved and applied.");
          }
          return result.changed;
        },
        { rows: 1, cols: 6 },
      ),
    ).setName("Server port");
    portSetting.settingEl.toggle(server.enableServer);
  }
  annotView(): void {
    new Setting(this.containerEl).setHeading().setName("Annotaion View");
    // this.setMutool();
  }
  setMutool() {
    throw new Error("Not implemented");
    // this.pipe(
    //   addTextComfirm(
    //     () => this.plugin.settings.mutoolPath ?? "",
    //     async (value: string, _text) => {
    //       try {
    //         await access(value, constants.X_OK);
    //         new Notice("mutool path is saved.");
    //         this.plugin.settings.mutoolPath = value;
    //         return true;
    //       } catch (error) {
    //         if ((error as NodeJS.ErrnoException).code === "ENOENT") {
    //           new Notice("File not found");
    //         } else if ((error as NodeJS.ErrnoException).code === "EACCES") {
    //           new Notice("File not executable");
    //         } else {
    //           throw error;
    //         }
    //         return false;
    //       }
    //     },
    //     { rows: 1 },
    //   ),
    // ).setName("`mutool` path");
  }

  normalizePath(path: string, text: TextAreaComponent) {
    const newPath = new InVaultPath(path).path;
    // correct with normalized path
    if (newPath !== path) {
      text.setValue(newPath);
    }
    return newPath;
  }

  setDataDirPath() {
    const el = new Setting(this.containerEl).settingEl;
    ReactDOM.render(<DatabaseSetting plugin={this.plugin} />, el);
    this.register(() => ReactDOM.unmountComponentAtNode(el));
  }
  setCitationLibrary() {
    let dropdown: DropdownComponent | null = null;
    const { plugin } = this;
    const setting: Setting = new Setting(this.containerEl)
      .setName("Citation Library")
      .addButton((cb) =>
        cb
          .setIcon("switch")
          .setTooltip("Refresh")
          .onClick(async () => {
            await plugin.dbWorker.refresh({ task: "full" });
            await renderDropdown(setting);
          }),
      )
      .then(renderDropdown);
    async function renderDropdown(s: Setting) {
      const { database } = plugin.settings;
      if (dropdown) {
        dropdown.selectEl.remove();
        dropdown = null;
      }
      const libs = await plugin.databaseAPI.getLibs();
      s.addDropdown((dd) => {
        dropdown = dd;
        dd.addOptions(
          pipe(
            libs,
            map(({ libraryID, name, groupID }) => {
              const display = name
                ? groupID
                  ? `${name} (Group)`
                  : name
                : `Library ${libraryID}`;
              return [libraryID.toString(), display] as const;
            }),
            fromPairs,
          ),
        )
          .setValue(database.citationLibrary.toString())
          .onChange(async (val) => {
            const isChanged = await database
              .setOption("citationLibrary", +val)
              .apply();
            if (!isChanged) return;
            new Notice("Zotero search index updated.");
            await plugin.settings.save();
          });
      });
    }
  }
  templates(): void {
    const { template } = this.plugin.settings;

    new Setting(this.containerEl).setHeading().setName("Templates");
    // template folder
    this.pipe(
      addTextComfirm(
        () => template.folder,
        async (value: string, text: TextAreaComponent) => {
          return await template
            .setOption("folder", this.normalizePath(value, text))
            .apply();
        },
        { rows: 1 },
      ),
    )
      .setName("Template Folder")
      .setDesc("The folder which templates are ejected into and stored");

    this.pipe(
      addToggle(
        () => template.autoPairEta,
        async (val) => {
          return await template.setOption("autoPairEta", val).apply();
        },
      ),
    )
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
    for (const key of nonEjectableTemplateTypes) {
      const { title, desc } = templateDesc[key];
      this.pipe(
        addTextComfirm(
          () => template.templates[key],
          async (value) => template.setTemplate(key, value),
          { rows: 2 },
        ),
      )
        .setName(title)
        .then((setting) => desc && setting.setDesc(desc));
    }

    const setting = new Setting(this.containerEl)
      .setHeading()
      .setName("Ejectable")
      .setDesc("These templates can be customized once ejected into vault")
      .addExtraButton((btn) =>
        btn.then(setEjectButton).onClick(async () => {
          await template.setOption("ejected", !template.ejected).apply();
          await this.plugin.settings.save();
          setEjectButton(btn);
          setEjectLabel(labelEl);
          this.setEjectableTemplates(ejectableContainer);
        }),
      );

    const labelEl = setting.controlEl.createDiv();
    setEjectLabel(labelEl);

    const ejectableContainer = this.containerEl.createDiv();
    this.setEjectableTemplates(ejectableContainer);

    function setEjectButton(btn: ExtraButtonComponent) {
      let icon, desc;
      if (!template.ejected) {
        icon = "folder-input";
        desc = "Eject templates into vault";
      } else {
        icon = "x-circle";
        desc = "Revert templates to default";
      }
      btn.setIcon(icon).setTooltip(desc);
    }
    function setEjectLabel(label: HTMLElement) {
      if (!template.ejected) {
        label.setText("Eject");
      } else {
        label.setText("Revert");
      }
    }
  }
  setEjectableTemplates(container: HTMLElement) {
    container.empty();
    const { template } = this.plugin.settings;
    for (const name of ejectableTemplateTypes) {
      const { title, desc } = templateDesc[name];
      const loader = this.plugin.templateLoader;
      if (template.ejected) {
        new Setting(container)
          .setName(name)
          .setDesc(desc)
          .then((setting) =>
            setting.controlEl.createDiv("", (el) => {
              el.createEl("code", { text: loader.getTemplateFile(name) });
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
                  loader.getTemplateFile(name),
                  "",
                );
                (this as any).setting.close();
              }),
          );
      } else {
        this.pipe(
          container,
          addTextField(() => loader.getTemplate(name)),
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
            if (
              await this.plugin.settings.log
                .setOption("level", val as LogLevel)
                .apply()
            ) {
              await this.plugin.settings.save();
            }
          }),
      );
  };
}

const templateDesc: Record<
  TemplateType,
  { title: string; desc: DocumentFragment | string }
> = {
  filename: { title: "Note Filename", desc: "" },
  citation: { title: "Markdown primary citation template", desc: "" },
  altCitation: { title: "Markdown secondary citation template", desc: "" },
  note: {
    title: "Note Content",
    desc: "Used to render created literature note",
  },
  annotation: {
    title: "Annotaion",
    desc: "Used to render single annotation",
  },
  annots: {
    title: "Annotations",
    desc: "Used to render annotation list when batch importing",
  },
};
