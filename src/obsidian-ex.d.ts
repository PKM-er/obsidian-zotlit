import "obsidian";
declare module "obsidian" {
  interface FileManager {
    createNewMarkdownFileFromLinktext(
      linktext: string,
      sourcePath: string,
    ): TFile;
  }
  interface MetadataCache {
    on(name: "finished", callback: () => any, ctx?: any): EventRef;
    initialized: boolean;
  }
}
