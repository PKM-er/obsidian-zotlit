import { InVaultPath } from "../../settings";

import Settings from "../settings-base";

interface SettingOptions {
  symlinkImgExcerpt: boolean;
  imgExcerptPath: InVaultPath;
}

export class ImgImporterSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      symlinkImgExcerpt: false,
      imgExcerptPath: new InVaultPath("ZtImgExcerpt"),
    };
  }
  fromJSON(json: SettingOptions): void {
    super.fromJSON(json);
    // convert string to InVaultPath in case of overwriting
    if (typeof this.imgExcerptPath === "string") {
      this.imgExcerptPath = new InVaultPath(this.imgExcerptPath);
    }
  }
  get imgExcerptDir(): string | null {
    return this.symlinkImgExcerpt ? this.imgExcerptPath.path : null;
  }
}
