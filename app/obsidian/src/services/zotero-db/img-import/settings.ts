import { Platform } from "obsidian";

export interface SettingsImgImporter {
  imgExcerptImport: false | "symlink" | "copy";
  imgExcerptPath: string;
}

export const defaultSettingsImgImporter: SettingsImgImporter = {
  imgExcerptImport: Platform.isWin ? "copy" : "symlink",
  imgExcerptPath: "ZtImgExcerpt",
};
