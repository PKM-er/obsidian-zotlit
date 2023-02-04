import assertNever from "assert-never";
import Settings from "@/settings/base";

interface SettingOptions {
  citationEditorSuggester: boolean;
  showCitekeyInSuggester: boolean;
}

export class SuggesterSettings extends Settings<SettingOptions> {
  getDefaults() {
    return {
      citationEditorSuggester: true,
      showCitekeyInSuggester: false,
    };
  }
  async apply(
    key: "citationEditorSuggester" | "showCitekeyInSuggester",
  ): Promise<void> {
    switch (key) {
      case "citationEditorSuggester":
      case "showCitekeyInSuggester":
        return;
      default:
        assertNever(key);
    }
  }
}
