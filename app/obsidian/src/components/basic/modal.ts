import { around } from "monkey-around";
import type { FuzzyMatch as FuzzyMatchOb } from "obsidian";
import { SuggestModal, debounce } from "obsidian";
import type { FuzzyMatch as FuzzyMatchFuse } from "../item-suggest";

type Result<T> = { value: T; evt: MouseEvent | KeyboardEvent };

type FuzzyMatch<T> = FuzzyMatchOb<T> | FuzzyMatchFuse<T>;

type FromFuzzyMatch<T> = T extends FuzzyMatch<infer V> ? V : never;

export function openModal<F extends FuzzyMatch<any>, V = FromFuzzyMatch<F>>(
  modal: SuggestModal<F>,
): Promise<Result<V> | null> {
  let resolve!: (value: Result<V> | null) => void;
  // reject!: (reason?: any) => void;
  const promise = new Promise<Result<V> | null>((_resolve, _reject) => {
    resolve = _resolve;
    // reject = _reject;
  });
  const unload = around(modal, {
    selectSuggestion: (next) =>
      function selectSuggestion(this: SuggestModal<F>, value, evt, ...args) {
        // super.selectSuggestion call onClose before onChooseSelection
        // so we need to resolve the promise before calling original method
        resolve(value !== null ? { value: value.item, evt } : null);
        return next.call(this, value, evt, ...args);
      },
    onClose: (next) =>
      function onClose(this: SuggestModal<F>, ...args) {
        // won't be resolve again if called from selectSuggestion
        resolve(null);
        return next.call(this, ...args);
      },
  });
  promise.finally(unload);
  modal.open();
  return promise;
}

declare module "obsidian" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SuggestModal<T> {
    updateSuggestions(): void;
  }
}

export abstract class DebouncedSuggeestModal<T> extends SuggestModal<T> {
  initial = true;
  async #updateSuggestions() {
    const input = this.inputEl.value;
    let suggestions = await this.getSuggestions(input);
    if (0 !== suggestions.length) {
      const n = this.limit;
      n && n > 0 && (suggestions = suggestions.slice(0, n)),
        (this as any).chooser.setSuggestions(suggestions);
    } else
      input
        ? this.onNoSuggestion()
        : (this as any).chooser.setSuggestions(null);
  }
  #requestUpdate = debounce(this.#updateSuggestions.bind(this), 250, true);
  updateSuggestions() {
    if (this.initial) {
      this.#updateSuggestions();
      this.initial = false;
    } else this.#requestUpdate();
  }
}
