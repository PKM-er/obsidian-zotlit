import "./style.less";

import { RegularItem } from "@zt-types";
import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
} from "obsidian";

import ZoteroPlugin from "../zt-main";
import {
  CLASS_ID,
  FuzzyMatch,
  getSuggestions,
  renderSuggestion,
  SuggesterBase,
} from "./core";

export default abstract class ZoteroItemSuggester
  extends EditorSuggest<FuzzyMatch<RegularItem>>
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
    suggestion: FuzzyMatch<RegularItem>,
    evt: MouseEvent | KeyboardEvent,
  ): void;
}
