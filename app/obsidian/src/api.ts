import type {
  ItemIDLibID,
  ItemKeyLibID,
  RegularItemInfo,
} from "@obzt/database";
import type { ZoteroDatabase } from "./services/zotero-db";

export interface PluginAPI {
  version: string;
  getDocItems(
    items: ItemIDLibID[] | ItemKeyLibID[],
  ): Promise<(RegularItemInfo | null)[]>;
  getAnnotsOfAtch: ZoteroDatabase["api"]["getAnnotations"];
  getAnnotsFromKeys: ZoteroDatabase["api"]["getAnnotFromKey"];
  getAttachments: ZoteroDatabase["api"]["getAttachments"];
  getItemIDsFromCitekey: ZoteroDatabase["api"]["getItemIDsFromCitekey"];
  getLibs: ZoteroDatabase["api"]["getLibs"];
}
