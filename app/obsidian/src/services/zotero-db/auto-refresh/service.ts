import type { FSWatcher } from "fs";
import { watch } from "fs";
import { map } from "@mobily/ts-belt/Dict";
import { Service } from "@ophidian/core";
import log from "@/log";
import DatabaseWorker from "../connector/service";
import { DatabaseSettings } from "../connector/settings";
import { WatcherSettings } from "./settings";

const onDatabaseUpdate = (target: "main" | "bbt") => () =>
  app.vault.trigger("zotero:db-updated", target);

export default class DatabaseWatcher extends Service {
  databaseSettings = this.use(DatabaseSettings);
  settings = this.use(WatcherSettings);

  api = this.use(DatabaseWorker).api;

  async onload() {
    await this.setAutoRefresh(this.settings.autoRefresh);
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
        this.databaseSettings.zoteroDbPath,
        onDatabaseUpdate("main"),
      );
      if (await this.api.checkDbStatus("bbt")) {
        this.#watcher.bbt = watch(
          this.databaseSettings.betterBibTexDbPath,
          onDatabaseUpdate("bbt"),
        );
      }
    }
  }
}

declare module "obsidian" {
  interface Vault {
    on(
      name: "zotero:db-updated",
      callback: (target: "main" | "bbt") => any,
      ctx?: any,
    ): EventRef;
    trigger(name: "zotero:db-updated", target: "main" | "bbt"): void;
  }
}
