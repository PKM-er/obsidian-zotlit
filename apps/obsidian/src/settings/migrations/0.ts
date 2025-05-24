export interface PluginSettingsV0 {
  logLevel: LogLevel;
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
  literatureNoteFolder: string;
  enableServer: boolean;
  serverPort: number;
  serverHostname: string;
  template: {
    folder: string;
    templates: Record<TemplateTypeEmbeded, string>;
  };
  updateAnnotBlock: boolean;
  updateOverwrite: boolean;
  autoPairEta: boolean;
  autoTrim: [TrimConfig, TrimConfig];
  autoRefresh: boolean;
  zoteroDataDir: string;
  citationLibrary: number;
  imgExcerptImport: false | "symlink" | "copy";
  imgExcerptPath: string;
}

export type TemplateTypeEjectable =
  | "note"
  | "field"
  | "annots"
  | "annotation"
  | "cite"
  | "cite2"
  | "colored";
export type TemplateTypeEmbeded = "filename";

export type TrimConfig = "nl" | "slurp" | false;
export type LogLevel =
  | "ALL"
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL"
  | "MARK"
  | "OFF";
