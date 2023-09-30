export interface SettingsSuggester {
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
}

export const defaultSettingsSuggester: SettingsSuggester = {
  citationEditorSuggester: true,
  showCitekeyInSuggester: false,
};
