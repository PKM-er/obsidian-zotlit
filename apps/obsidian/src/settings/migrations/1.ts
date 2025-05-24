import type { PluginSettingsV0 } from "./0";
import * as v from "valibot";
import { homedir } from "node:os";
import { join } from "node:path";

// Define validation schemas for the types
const logLevel = v.picklist([
  "ALL",
  "TRACE",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
  "MARK",
  "OFF",
]);

const trimConfig = v.union([
  v.literal("nl"),
  v.literal("slurp"),
  v.literal(false),
]);

const imgExcerptImport = v.union([
  v.literal(false),
  v.literal("symlink"),
  v.literal("copy"),
]);

// const templateTypeEmbeded = v.literal("filename");
// const templateTypeEjectable = v.picklist([
//   "note",
//   "field",
//   "annots",
//   "annotation",
//   "cite",
//   "cite2",
//   "colored",
// ]);

export type LogLevel = v.InferOutput<typeof logLevel>;
export type TrimConfig = v.InferOutput<typeof trimConfig>;
// export type TemplateTypeEmbeded = v.InferOutput<typeof templateTypeEmbeded>;
// export type TemplateTypeEjectable = v.InferOutput<typeof templateTypeEjectable>;

const base = { __VERSION__: 1 } as const;

export const pluginSettingsV1 = v.object({
  __VERSION__: v.literal(1),

  "logging.level": v.fallback(logLevel, "INFO"),

  "suggester.citation-editor-suggester": v.fallback(v.boolean(), true),
  "suggester.show-citekey-in-suggester": v.fallback(v.boolean(), true),

  "notes.folder": v.fallback(v.string(), "Literatures"),

  "server.enabled": v.fallback(v.boolean(), false),
  "server.port": v.fallback(
    v.pipe(v.number(), v.minValue(1), v.maxValue(65535)),
    9091,
  ),
  "server.hostname": v.fallback(v.string(), "127.0.0.1"),

  "template.folder": v.fallback(v.string(), "Zotero Templates"),
  "template.templates.filename": v.fallback(v.string(), ""),

  "template.update-block": v.fallback(v.boolean(), false),
  "template.update-overwrite": v.fallback(v.boolean(), false),

  "template.auto-pair-eta": v.fallback(v.boolean(), false),
  "template.auto-trim": v.fallback(v.tuple([trimConfig, trimConfig]), [
    false,
    false,
  ]),

  "database.auto-refresh": v.fallback(v.boolean(), true),
  "database.zotero-data-dir": v.fallback(v.string(), join(homedir(), "Zotero")),
  "database.citation-library": v.fallback(v.number(), 1),

  "attachment.img-excerpt-import": v.fallback(imgExcerptImport, false),
  "attachment.img-excerpt-path": v.fallback(v.string(), ""),
});

export type PluginSettingsV1 = v.InferInput<typeof pluginSettingsV1>;

export function migrateSettingsV1(settings: any): PluginSettingsV1 {
  const prev = settings as Partial<PluginSettingsV0>;
  const migrated = v.parse(pluginSettingsV1, base);

  if (prev.logLevel !== undefined) {
    if (v.is(logLevel, prev.logLevel)) {
      migrated["logging.level"] = prev.logLevel;
    }
  }

  // Migrate UI settings
  if (prev.citationEditorSuggester !== undefined) {
    migrated["suggester.citation-editor-suggester"] =
      prev.citationEditorSuggester;
  }
  if (prev.showCitekeyInSuggester !== undefined) {
    migrated["suggester.show-citekey-in-suggester"] =
      prev.showCitekeyInSuggester;
  }

  // Migrate notes settings
  if (prev.literatureNoteFolder !== undefined) {
    migrated["notes.folder"] = prev.literatureNoteFolder;
  }

  if (prev.enableServer !== undefined) {
    migrated["server.enabled"] = prev.enableServer;
  }
  if (prev.serverPort !== undefined) {
    migrated["server.port"] = prev.serverPort;
  }
  if (prev.serverHostname !== undefined) {
    migrated["server.hostname"] = prev.serverHostname;
  }

  if (prev.template?.folder !== undefined) {
    migrated["template.folder"] = prev.template.folder;
  }
  if (prev.template?.templates.filename !== undefined) {
    migrated["template.templates.filename"] = prev.template.templates.filename;
  }

  if (prev.updateAnnotBlock !== undefined) {
    migrated["template.update-block"] = prev.updateAnnotBlock;
  }
  if (prev.updateOverwrite !== undefined) {
    migrated["template.update-overwrite"] = prev.updateOverwrite;
  }

  // Migrate formatting settings
  if (prev.autoPairEta !== undefined) {
    migrated["template.auto-pair-eta"] = prev.autoPairEta;
  }
  if (prev.autoTrim !== undefined) {
    migrated["template.auto-trim"] = prev.autoTrim;
  }

  if (prev.autoRefresh !== undefined) {
    migrated["database.auto-refresh"] = prev.autoRefresh;
  }
  if (prev.zoteroDataDir !== undefined) {
    migrated["database.zotero-data-dir"] = prev.zoteroDataDir;
  }
  if (prev.citationLibrary !== undefined) {
    migrated["database.citation-library"] = prev.citationLibrary;
  }

  if (prev.imgExcerptImport !== undefined) {
    migrated["attachment.img-excerpt-import"] = prev.imgExcerptImport;
  }
  if (prev.imgExcerptPath !== undefined) {
    migrated["attachment.img-excerpt-path"] = prev.imgExcerptPath;
  }

  // Return with type assertion
  return v.parse(pluginSettingsV1, migrated);
}

export function loadSettingsV1(inputs?: any): PluginSettingsV1 {
  const settings = v.safeParse(pluginSettingsV1, inputs || base);
  if (settings.success) return settings.output;
  const defaults = v.parse(pluginSettingsV1, base);
  console.error(
    "Invalid settings in plugin settings v1, fallback to default",
    settings.issues,
  );
  return defaults;
}
