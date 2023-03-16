import { useContext } from "react";
import { SettingTabCtx, normalizePath } from "../common";
import { BooleanSettingBase, useBoolean } from "../components/Boolean";
import TextComfirmSetting from "../components/TextComfirm";

export function ImageExcerptSetting() {
  const { imgImporter } = useContext(SettingTabCtx).plugin.settings;
  const [value, ref] = useBoolean(imgImporter, "symlinkImgExcerpt");
  return (
    <>
      <BooleanSettingBase ref={ref} name="Image Excerpt" />
      {value && (
        <TextComfirmSetting
          name="Image Excerpts Folder"
          settings={imgImporter}
          prop="imgExcerptPath"
          normalize={normalizePath}
        />
      )}
    </>
  );
}
