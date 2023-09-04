import { Platform } from "obsidian";
import Settings from "@/settings/base";

interface SettingOptions {
  mode: false | "symlink" | "copy";
  imgExcerptPath: string;
}

type SettingOptionsJSON = Omit<SettingOptions, "importImg"> & {
  symlinkImgExcerpt?: boolean;
} & Partial<Pick<SettingOptions, "mode">>;

export class ImgImporterSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      mode: Platform.isWin ? "copy" : "symlink",
      imgExcerptPath: "ZtImgExcerpt",
    } satisfies SettingOptions;
  }
  get imgExcerptDir(): string | null {
    return this.mode ? this.imgExcerptPath : null;
  }
  fromJSON({ mode, symlinkImgExcerpt, ...json }: SettingOptionsJSON): void {
    super.fromJSON({
      ...json,
      mode:
        mode ??
        (symlinkImgExcerpt !== undefined
          ? symlinkImgExcerpt === true
            ? "symlink"
            : false
          : undefined) ??
        this.getDefaults().mode,
    });
  }
}
