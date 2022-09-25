import "./style.less";

import type { RegularItem } from "@obzt/zotero-type";
import { debounce, SuggestModal } from "obsidian";

import type ZoteroPlugin from "../zt-main.js";
import type { FuzzyMatch, SuggesterBase } from "./core.js";
import {
  CLASS_ID,
  getSuggestions,
  isAlternative,
  renderSuggestion,
} from "./core.js";

type ModalResult = { item: RegularItem; alt: boolean };

export default class ZoteroItemSelector
  extends SuggestModal<FuzzyMatch<RegularItem>>
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

  // Promisify the modal
  resolve: ((value: ModalResult | null) => void) | null = null;
  promise: Promise<ModalResult | null> | null = null;
  open(): Promise<ModalResult | null> {
    super.open();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    return this.promise;
  }
  onClose() {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  onChooseSuggestion(): void {
    // console.log(suggestion);
  }
  selectSuggestion(
    value: FuzzyMatch<RegularItem> | null,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (this.resolve) {
      if (value?.item) {
        this.resolve({ item: value.item, alt: isAlternative(evt) });
      } else {
        this.resolve(null);
      }
      this.resolve = null;
    }

    super.selectSuggestion(value as never, evt);
  }
}
