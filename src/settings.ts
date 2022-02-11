import { homedir } from "os";
import path from "path";

import NoteTemplate from "./note-template";
import ZoteroPlugin from "./zt-main";

export interface ZoteroSettings {
  zoteroDbPath: string;
  literatureNoteFolder: string;
  literatureNoteTemplate: NoteTemplate;
}

export const getDefaultSettings: () => ZoteroSettings = () => ({
  zoteroDbPath: path.join(homedir(), "Zotero", "zotero.sqlite"),
  literatureNoteFolder: "",
  literatureNoteTemplate: new NoteTemplate(),
});

export async function loadSettings(this: ZoteroPlugin) {
  const json = await this.loadData();
  this.settings = {
    ...this.settings,
    ...json,
    literatureNoteTemplate: this.settings.literatureNoteTemplate.updateFromJSON(
      json?.literatureNoteTemplate,
    ),
  };
}

export async function saveSettings(this: ZoteroPlugin) {
  await this.saveData(this.settings);
}
