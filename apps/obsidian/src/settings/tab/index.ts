import type ZotlitPlugin from "@/zt-main";
import { type App, PluginSettingTab } from "obsidian";
import { SettingAccessor } from "../registry/accessor";
import type { SettingsContext } from "./components/_ctx";

export class ZotlitSettingTab extends PluginSettingTab {
  #render(ctx: SettingsContext, stack: DisposableStack) {
    // components goes here
  }

  plugin: ZotlitPlugin;
  stack: DisposableStack | null = null;

  constructor(app: App, plugin: ZotlitPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  hide(): void {
    this.stack?.dispose();
    this.containerEl.empty();
  }

  display(): void {
    this.containerEl.empty();

    this.plugin.settings.loaded.then(() => {
      using stack = new DisposableStack();
      this.#render(
        {
          containerEl: this.containerEl,
          settings: new SettingAccessor(this.plugin.settings),
        },
        stack,
      );
      this.stack = stack.move();
    });
  }
}
