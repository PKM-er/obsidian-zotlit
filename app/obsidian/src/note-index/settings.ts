import assertNever from "assert-never";
import Settings from "../settings/base";
import NoteIndex from "./service";

interface SettingOptions {
  literatureNoteFolder: string;
}

export class NoteIndexSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      literatureNoteFolder: "LiteratureNotes",
    };
  }
  async apply(key: "literatureNoteFolder"): Promise<void> {
    if (key === "literatureNoteFolder") {
      this.use(NoteIndex).reload();
    } else {
      assertNever(key);
    }
  }

  get joinPath() {
    return getFolderJoinPath(this.literatureNoteFolder);
  }
}

const getFolderJoinPath = (folder: string): string =>
  folder === "/" ? "" : folder + "/";
