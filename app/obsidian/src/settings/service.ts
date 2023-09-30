import { defaultSettingsLog } from "@/log";
import { defaultSettingsSuggester } from "@/note-feature/citation-suggest/settings";
import { defaultSettingsNoteIndex } from "@/services/note-index/settings";
import { defaultSettingsServer } from "@/services/server/settings";
import { defaultSettingsTemplate } from "@/services/template/settings";
import { defaultSettingsWatcher } from "@/services/zotero-db/auto-refresh/settings";
import { getDefaultSettingsDatabase } from "@/services/zotero-db/connector/settings";
import { defaultSettingsImgImporter } from "@/services/zotero-db/img-import/settings";

export const getDefaultSettings = () => ({
  ...defaultSettingsLog,
  ...defaultSettingsSuggester,
  ...defaultSettingsNoteIndex,
  ...defaultSettingsServer,
  ...defaultSettingsTemplate,
  ...defaultSettingsWatcher,
  ...getDefaultSettingsDatabase(),
  ...defaultSettingsImgImporter,
});

export type Settings = ReturnType<typeof getDefaultSettings>;
