import "./style.less";

import { debounce, Editor, SuggestModal } from "obsidian";

import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import {
  CLASS_ID,
  FuzzyMatch,
  getSuggestions,
  isAlternative,
  renderSuggestion,
  SuggesterBase,
} from "./core";

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
  async _updateSuggestions() {
    let input = this.inputEl.value,
      suggestions = await this.getSuggestions(input);
    if (0 !== suggestions.length) {
      let n = this.limit;
      n && n > 0 && (suggestions = suggestions.slice(0, n)),
        (this as any).chooser.setSuggestions(suggestions);
    } else
      input
        ? this.onNoSuggestion()
        : (this as any).chooser.setSuggestions(null);
  }
  debouncedUpdate = debounce(this._updateSuggestions, 250, true);
  updateSuggestions() {
    if (this.initial) {
      this._updateSuggestions();
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

    super.selectSuggestion(value as any, evt);
  }
}
