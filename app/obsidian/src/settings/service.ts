import { D, pipe } from "@mobily/ts-belt";
import { enumerate } from "@obzt/common";
import { Service } from "@ophidian/core";

import { NoteFieldsSettings } from "@/note-feature/note-fields/settings.js";
import { NoteIndexSettings } from "@/note-index/settings.js";
import { ServerSettings } from "@/server/settings.js";
import { SuggesterSettings } from "@/suggester/settings.js";
import { TemplateSettings } from "@/template/settings.js";
import { WatcherSettings } from "@/zotero-db/auto-refresh/settings.js";
import { DatabaseSettings } from "@/zotero-db/connector/settings.js";
import { ImgImporterSettings } from "@/zotero-db/img-import/settings.js";
import ZoteroPlugin from "@/zt-main.js";
import Settings from "./base";
import log, { LogSettings } from "@/log";

export interface ZoteroSettings {
  database: DatabaseSettings;
  watcher: WatcherSettings;
  imgImporter: ImgImporterSettings;
  log: LogSettings;
  noteIndex: NoteIndexSettings;
  template: TemplateSettings;
  suggester: SuggesterSettings;
  noteFields: NoteFieldsSettings;
  server: ServerSettings;
  // mutoolPath: string | null;
}
const settingNames = enumerate<keyof ZoteroSettings>()(
  "database",
  "watcher",
  "imgImporter",
  "log",
  "noteIndex",
  "template",
  "suggester",
  "noteFields",
  "server",
  // "mutoolPath",
);

export type SettingKeyWithType<T> = {
  [K in keyof ZoteroSettings]: ZoteroSettings[K] extends T ? K : never;
}[keyof ZoteroSettings];

export class SettingLoader extends Service implements ZoteroSettings {
  plugin = this.use(ZoteroPlugin);

  // #region Settings
  noteIndex = this.use(NoteIndexSettings);
  database = this.use(DatabaseSettings);
  watcher = this.use(WatcherSettings);
  imgImporter = this.use(ImgImporterSettings);
  log = this.use(LogSettings);
  template = this.use(TemplateSettings);
  suggester = this.use(SuggesterSettings);
  noteFields = this.use(NoteFieldsSettings);
  server = this.use(ServerSettings);
  // mutoolPath: string | null = null;
  // #endregion

  async onload(): Promise<void> {
    log.debug("Loading Settings...");
    const json = (await this.plugin.loadData()) ?? {};
    pipe(this, D.selectKeys(settingNames), D.values).forEach((setting) =>
      setting.fromJSON(json),
    );
    // call this manually since no Sevice is used to apply settings on load
    await this.log.applyAll();

    // const { mutoolPath } = json;
    // if (typeof mutoolPath === "string" && mutoolPath) {
    //   this.mutoolPath = mutoolPath;
    // }
    log.debug("Settings loaded");
  }

  async save() {
    // pick settings fields from loader, return an array of json objects
    const values = pipe(
      this,
      D.selectKeys(settingNames),
      D.mapWithKey((k, v) => (v instanceof Settings ? v.toJSON() : { [k]: v })),
      D.values,
    );
    // merge all json objects into one and save
    await this.plugin.saveData(Object.assign({}, ...values));
  }
}
