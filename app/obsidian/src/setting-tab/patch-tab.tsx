import { around } from "monkey-around";
import { PluginSettingTab } from "obsidian";

import log from "@/log";

export default abstract class PluginSettingTabWithLifecycle extends PluginSettingTab {
  // patches for life cycle
  #patchUnload(): boolean {
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
    this.#events.push(func);
  }
  unload(): void {
    while (this.#events.length > 0) {
      this.#events.pop()!();
    }
  }

  display(): void {
    this.containerEl.empty();
    this.#patchUnload();
  }
}
