import Settings from "@/settings/base";

interface SettingOptions {
  symlinkImgExcerpt: boolean;
  imgExcerptPath: string;
}

export class ImgImporterSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      symlinkImgExcerpt: false,
      imgExcerptPath: "ZtImgExcerpt",
    };
  }
  get imgExcerptDir(): string | null {
    return this.symlinkImgExcerpt ? this.imgExcerptPath : null;
  }
}
