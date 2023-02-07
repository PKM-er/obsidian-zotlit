import type { RegularItemInfo } from "@obzt/database";

import { DebouncedSuggeestModal } from "../basic/modal.js";
import type { FuzzyMatch, SuggesterBase } from "./core.js";
import { CLASS_ID, getSuggestions, renderSuggestion } from "./core.js";
import type ZoteroPlugin from "@/zt-main.js";

export class ZoteroItemPopupSuggest
  extends DebouncedSuggeestModal<FuzzyMatch<RegularItemInfo>>
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
