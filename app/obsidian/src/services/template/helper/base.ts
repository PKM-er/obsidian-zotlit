import type ZoteroPlugin from "@/zt-main";

export interface Context {
  sourcePath?: string | null;
  plugin: ZoteroPlugin;
  /** enable merging cross-page annotation */
  merge?: boolean;
}

export const zoteroDataDir = (ctx: Context) =>
  ctx.plugin.settings.database.zoteroDataDir;

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Proxied = Symbol("proxied");
export const isProxied = (obj: any): boolean => !!(obj as any)[Proxied];
