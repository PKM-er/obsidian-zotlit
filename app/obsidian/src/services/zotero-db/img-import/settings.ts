import { Platform } from "obsidian";
import Settings from "@/settings/base";

interface SettingOptions {
  imgExcerptImport: false | "symlink" | "copy";
  imgExcerptPath: string;
}

type SettingOptionsJSON = Omit<SettingOptions, "importImg"> & {
  symlinkImgExcerpt?: boolean;
} & Partial<Pick<SettingOptions, "imgExcerptImport">>;

export class ImgImporterSettings extends Settings<SettingOptions> {
  get mode() {
    return this.imgExcerptImport;
  }
  getDefaults() {
    return {
      imgExcerptImport: Platform.isWin ? "copy" : "symlink",
      imgExcerptPath: "ZtImgExcerpt",
    } satisfies SettingOptions;
  }
  get imgExcerptDir(): string | null {
    return this.mode ? this.imgExcerptPath : null;
  }
  fromJSON({
    imgExcerptImport,
    symlinkImgExcerpt,
    ...json
  }: SettingOptionsJSON): void {
    super.fromJSON({
      ...json,
      imgExcerptImport:
        imgExcerptImport ??
        (symlinkImgExcerpt !== undefined
          ? symlinkImgExcerpt === true
            ? "symlink"
            : false
          : undefined) ??
        this.getDefaults().imgExcerptImport,
    });
  }
}
