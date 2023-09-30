import { homedir } from "os";
import { join } from "path";

export interface SettingsDatabase {
  zoteroDataDir: string;
  citationLibrary: number;
}

export const getDefaultSettingsDatabase = (): SettingsDatabase => ({
  zoteroDataDir: join(homedir(), "Zotero"),
  citationLibrary: 1,
});
