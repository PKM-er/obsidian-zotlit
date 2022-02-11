import "obsidian";
declare module "obsidian" {
  interface FileManager {
    createNewMarkdownFileFromLinktext(
      linktext: string,
      sourcePath: string,
    ): TFile;
  }
}
