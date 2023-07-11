/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "obsidian";
declare module "obsidian" {
  interface App {
    plugins: {
      enablePlugin(id: string): Promise<void>;
      disablePlugin(id: string): Promise<void>;
    };
    openWithDefaultApp(path: string): void;
  }

  interface WorkspaceLeaf {
    group: string | null;
  }
  interface WorkspaceItem {
    type: string;
  }
  interface Workspace {
    getActiveFileView(): FileView | null;
    ensureSideLeaf(
      viewType: string,
      side: "right" | "left",
      viewState: {
        /** @public */
        state?: any;
        /** @public */
        split?: boolean;
        /** @public */
        reveal?: boolean;
        /** @public */
        active?: boolean;
      },
    ): any;
  }

  interface PluginManifest {
    versions?: {
      "better-sqlite3": string;
    };
  }

  interface Vault {
    getConfig(key: string): any;
  }
  interface Vault {
    on(
      name: "zotero:template-updated",
      callback: (template: TemplateType) => any,
      ctx?: any,
    ): EventRef;
    on(
      name: "zotero:db-updated",
      callback: (target: "main" | "bbt") => any,
      ctx?: any,
    ): EventRef;
    on(name: "zotero:db-ready", callback: () => any, ctx?: any): EventRef;
    on(name: "zotero:db-refresh", callback: () => any, ctx?: any): EventRef;

    trigger(name: "zotero:template-updated", template: TemplateType): void;
    trigger(name: "zotero:db-updated", target: "main" | "bbt"): void;
    trigger(name: "zotero:db-ready"): void;
    trigger(name: "zotero:db-refresh"): void;
  }
  interface Notice {
    noticeEl: HTMLElement;
  }
  interface FileManager {
    createNewMarkdownFileFromLinktext(
      linktext: string,
      sourcePath: string,
    ): Promise<TFile>;
    createNewMarkdownFile(
      parent: TFolder,
      path?: string,
      content?: string,
    ): Promise<TFile>;
  }
  interface MetadataCache {
    on(name: "finished", callback: () => any, ctx?: any): EventRef;
    on(name: "initialized", callback: () => any, ctx?: any): EventRef;
    initialized: boolean;
  }
  interface MetadataCache {
    on(
      name: "zotero:index-update",
      callback: (file: string) => any,
      ctx?: any,
    ): EventRef;
    on(name: "zotero:index-clear", callback: () => any, ctx?: any): EventRef;
    on(name: "zotero:search-ready", callback: () => any, ctx?: any): EventRef;
    on(name: "zotero:search-refresh", callback: () => any, ctx?: any): EventRef;

    trigger(name: "zotero:index-update", file: string): void;
    trigger(name: "zotero:index-clear"): void;
    trigger(name: "zotero:search-ready"): void;
    trigger(name: "zotero:search-refresh"): void;
  }

  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }

  interface SuggestModal<T> {
    updateSuggestions(): void;
  }

  interface Editor {
    cm: EditorView;
    getClickableTokenAt(pos: EditorPosition): ClickableToken | null;
  }

  interface MarkdownView {
    editMode: MarkdownEditView;
  }
  interface MarkdownEditView {
    triggerClickableToken(token: ClickableToken, newLeaf: boolean): void;
  }
}
