import type ZoteroPlugin from "../../zt-main";

export interface Context {
  sourcePath?: string | null;
  plugin: ZoteroPlugin;
}

export const zoteroDataDir = (ctx: Context) =>
  ctx.plugin.settings.database.zoteroDataDir;
