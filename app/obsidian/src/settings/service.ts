import { pipe } from "@mobily/ts-belt";
import { mapWithKey, selectKeys, values } from "@mobily/ts-belt/Dict";
import { enumerate } from "@obzt/common";
import { Service } from "@ophidian/core";

import Settings from "./base";
import { SuggesterSettings } from "@/components/suggester/settings.js";
import log, { LogSettings } from "@/log";
import { NoteFieldsSettings } from "@/note-feature/note-fields/settings.js";
import { NoteIndexSettings } from "@/services/note-index/settings.js";
import { ServerSettings } from "@/services/server/settings.js";
import { TemplateSettings } from "@/services/template/settings.js";
import { WatcherSettings } from "@/services/zotero-db/auto-refresh/settings.js";
import { DatabaseSettings } from "@/services/zotero-db/connector/settings.js";
import { ImgImporterSettings } from "@/services/zotero-db/img-import/settings.js";
import ZoteroPlugin from "@/zt-main.js";

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
    pipe(this, selectKeys(settingNames), values).forEach((setting) =>
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
    const settings = pipe(
      this,
      selectKeys(settingNames),
      mapWithKey((k, v) => (v instanceof Settings ? v.toJSON() : { [k]: v })),
      values,
    );
    // merge all json objects into one and save
    await this.plugin.saveData(Object.assign({}, ...settings));
  }
}
