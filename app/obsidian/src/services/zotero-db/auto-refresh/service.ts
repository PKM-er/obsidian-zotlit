import type { FSWatcher } from "fs";
import { watch } from "fs";
import { map } from "@mobily/ts-belt/Dict";
import { Service, calc, effect } from "@ophidian/core";
import { App } from "obsidian";
import log from "@/log";
import { SettingsService, skip } from "@/settings/base";
import DatabaseWorker from "../connector/service";

export default class DatabaseWatcher extends Service {
  settings = this.use(SettingsService);

  api = this.use(DatabaseWorker).api;
  app = this.use(App);

  @calc
  get autoRefresh() {
    return this.settings.current?.autoRefresh;
  }

  onDatabaseUpdate(target: "main" | "bbt") {
    return () => this.app.vault.trigger("zotero:db-updated", target);
  }

  onload() {
    this.register(
      effect(
        skip(
          () => this.setAutoRefresh(this.autoRefresh),
          () => this.autoRefresh,
        ),
      ),
    );
    log.debug("loading DatabaseWatcher");
  }
  onunload(): void {
    this.#unloadWatchers();
  }

  #unloadWatchers() {
    this.#enabled = false;
    this.#watcher = map(this.#watcher, (w) => {
      w?.close();
      return null;
    });
  }

  #watcher: Record<"main" | "bbt", FSWatcher | null> = {
    main: null,
    bbt: null,
  };
  #enabled = false;

  async setAutoRefresh(enable: boolean, force = false) {
    if (enable === this.#enabled && !force) return;
    log.debug("Auto refresh set to " + enable);
    this.#enabled = enable;
    this.#unloadWatchers();
    if (enable) {
      this.#watcher.main = watch(
        this.settings.zoteroDbPath,
        this.onDatabaseUpdate("main"),
      );
      if (await this.api.checkDbStatus("bbt")) {
        this.#watcher.bbt = watch(
          this.settings.betterBibTexDbPath,
          this.onDatabaseUpdate("bbt"),
        );
      }
    }
  }
}
