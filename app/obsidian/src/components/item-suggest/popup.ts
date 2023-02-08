import { DebouncedSuggeestModal } from "../basic/modal.js";
import type { SuggesterBase } from "./core.js";
import { CLASS_ID, getSuggestions, renderSuggestion } from "./core.js";
import type { SearchResult } from "@/services/zotero-db/database.js";
import type ZoteroPlugin from "@/zt-main.js";

export class ZoteroItemPopupSuggest
  extends DebouncedSuggeestModal<SearchResult>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.modalEl.addClass(CLASS_ID);
  }

  // @ts-ignore
  getSuggestions(input: string) {
    return getSuggestions(input, this.plugin);
  }
  renderSuggestion = renderSuggestion.bind(this);

  onChooseSuggestion() {
    // handled with promise
    return;
  }
}
