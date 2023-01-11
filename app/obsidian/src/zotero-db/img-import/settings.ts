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
  async fromJSON(json: SettingOptions) {
    // convert string to InVaultPath in case of overwriting
    if (typeof json.imgExcerptPath === "string") {
      json.imgExcerptPath = new InVaultPath(json.imgExcerptPath);
    }
    await super.fromJSON(json);
  }
  get imgExcerptDir(): string | null {
    return this.symlinkImgExcerpt ? this.imgExcerptPath.path : null;
  }
}
