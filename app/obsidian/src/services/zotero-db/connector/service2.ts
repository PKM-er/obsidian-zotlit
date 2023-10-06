/* eslint-disable @typescript-eslint/naming-convention */
import { Server } from "http";
import { Service, calc } from "@ophidian/core";
import { App } from "obsidian";
import { SettingsService } from "@/settings/base";
import ZoteroPlugin from "@/zt-main";
import { DatabaseWorkerPool } from "./worker";

export const enum DatabaseStatus {
  NotInitialized,
  Pending,
  Ready,
}

export default class Database extends Service {
  settings = this.use(SettingsService);
  app = this.use(App);
  plugin = this.use(ZoteroPlugin);
  server = this.use(Server);
  #instance = new DatabaseWorkerPool({
    minWorkers: 1,
    maxWorkers: 1,
  });
  get api() {
    return this.#instance.proxy;
  }

  @calc get zoteroDataDir(): string {
    return this.settings.current?.zoteroDataDir;
  }

  #status = DatabaseStatus.NotInitialized;
}
