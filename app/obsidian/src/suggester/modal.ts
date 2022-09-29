import type { GeneralItem } from "@obzt/zotero-type";
import { debounce } from "obsidian";

import type ZoteroPlugin from "../zt-main.js";
import type { FuzzyMatch, SuggesterBase } from "./core.js";
import { CLASS_ID, getSuggestions, renderSuggestion } from "./core.js";
import { SuggestModalWithPromise } from "./modal-promise";

export default class ZoteroItemSuggestModal
  extends SuggestModalWithPromise<FuzzyMatch<GeneralItem>>
  implements SuggesterBase
{
  constructor(public plugin: ZoteroPlugin) {
    super(plugin.app);
    this.modalEl.addClass(CLASS_ID);
  }

  initial = true;
  async #updateSuggestions() {
    // eslint-disable-next-line prefer-const
    let input = this.inputEl.value,
      suggestions = await this.getSuggestions(input);
    if (0 !== suggestions.length) {
      const n = this.limit;
      n && n > 0 && (suggestions = suggestions.slice(0, n)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).chooser.setSuggestions(suggestions);
    } else
      input
        ? this.onNoSuggestion()
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).chooser.setSuggestions(null);
  }
  debouncedUpdate = debounce(this.#updateSuggestions, 250, true);
  updateSuggestions() {
    if (this.initial) {
      this.#updateSuggestions();
      this.initial = false;
    } else this.debouncedUpdate();
  }

  // @ts-ignore
  getSuggestions(input: string) {
    return getSuggestions(input, this.plugin);
  }
  renderSuggestion = renderSuggestion.bind(this);
}
