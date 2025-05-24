import { createStore } from "jotai";
import { atomWithPluginData } from "./atom";
import { Component, type Plugin } from "obsidian";
import type { LatestPluginSettings } from "./type";

export default class ZotlitSettings {
  plugin: Plugin;
  settingsAtoms: ReturnType<typeof atomWithPluginData>;
  store = createStore();

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.settingsAtoms = atomWithPluginData(plugin);
  }

  // must trigger this.loadSettings() in plugin onload()
  async loadSettings() {
    await this.store.set(this.settingsAtoms.reload);
  }

  get value() {
    return this.store.get(this.settingsAtoms.atom);
  }
  get loaded() {
    return new Promise<LatestPluginSettings>((resolve) => {
      const settings = this.store.get(this.settingsAtoms.atom);
      if (settings) {
        resolve(settings);
      }
      using stack = new DisposableStack();
      stack.defer(
        this.store.sub(this.settingsAtoms.atom, () => {
          const current = this.store.get(this.settingsAtoms.atom);
          if (!current) return;
          resolve(current);
        }),
      );
    });
  }

  set<K extends keyof LatestPluginSettings>(
    key: K,
    value: LatestPluginSettings[K],
  ) {
    this.store.set(this.settingsAtoms.atom, {
      ...this.store.get(this.settingsAtoms.atom),
      [key]: value,
    });
  }

  subscribe<K extends keyof LatestPluginSettings>(
    key: K,
    handler: (
      value: LatestPluginSettings[K],
      prev: LatestPluginSettings[K] | typeof naSymbol,
      settings: LatestPluginSettings,
    ) => void,
  ): Disposable {
    const settings = this.store.get(this.settingsAtoms.atom);
    let snapshot = !settings ? naSymbol : settings[key];
    using stack = new DisposableStack();
    stack.defer(
      this.store.sub(this.settingsAtoms.atom, () => {
        const currSettings = this.store.get(this.settingsAtoms.atom);
        if (!currSettings || !(key in currSettings)) return;
        const current = currSettings[key];
        handler(current, snapshot, currSettings);
        snapshot = current;
      }),
    );
    return stack.move();
  }
}

export const naSymbol = Symbol("na");
