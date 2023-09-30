import { normalizePath } from "../common";
import TextComfirmSetting from "../components/TextComfirm";
import { ImageExcerptSetting } from "./ImageExcerpt";
import CitationLibrarySelect from "./LibSelect";

export default function General() {
  return (
    <>
      <TextComfirmSetting
        name="Default location for new literature notes"
        get={(s) => s.literatureNoteFolder}
        set={(v, prev) => ({ ...prev, literatureNoteFolder: v })}
        normalize={normalizePath}
      />
      <CitationLibrarySelect />
      <ImageExcerptSetting />
    </>
  );
}
