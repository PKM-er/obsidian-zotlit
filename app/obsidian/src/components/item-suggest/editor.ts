import type { RegularItemInfo } from "@obzt/database";
import type {
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
} from "obsidian";
import { EditorSuggest } from "obsidian";

import type { FuzzyMatch, SuggesterBase } from "./core.js";
import { CLASS_ID, getSuggestions, renderSuggestion } from "./core.js";
import type ZoteroPlugin from "@/zt-main.js";

export abstract class ZoteroItemEditorSuggest
  extends EditorSuggest<FuzzyMatch<RegularItemInfo>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.suggestEl.addClass(CLASS_ID);
  }
  abstract onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null;

  getSuggestions(context: EditorSuggestContext) {
    return getSuggestions(context.query, this.plugin);
  }
  renderSuggestion = renderSuggestion.bind(this);

  abstract selectSuggestion(
    suggestion: FuzzyMatch<RegularItemInfo>,
    evt: MouseEvent | KeyboardEvent,
  ): void;
}
