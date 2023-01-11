/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "obsidian";
declare module "obsidian" {
  interface App {
    plugins: {
      enablePlugin(id: string): Promise<void>;
      disablePlugin(id: string): Promise<void>;
    };
  }

  interface WorkspaceLeaf {
    group: string | null;
  }
  interface Workspace {
    getActiveFileView(): FileView | null;
  }

  interface PluginManifest {
    versions?: {
      "better-sqlite3": string;
    };
  }

  interface Vault {
    getConfig(key: string): any;
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
    initialized: boolean;
  }

  interface EditorSuggest<T> {
    suggestEl: HTMLElement;
  }

  interface SuggestModal<T> {
    updateSuggestions(): void;
  }
}
