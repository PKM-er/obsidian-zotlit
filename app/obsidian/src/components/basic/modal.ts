import { around } from "monkey-around";
import { SuggestModal, debounce } from "obsidian";

type Result<T> = { value: T; evt: MouseEvent | KeyboardEvent };

export function openModal<T>(
  modal: SuggestModal<T>,
): Promise<Result<T> | null> {
  let resolve!: (value: Result<T> | null) => void;
  // reject!: (reason?: any) => void;
  const promise = new Promise<Result<T> | null>((_resolve, _reject) => {
    resolve = _resolve;
    // reject = _reject;
  });
  const unload = around(modal, {
    selectSuggestion: (next) =>
      function selectSuggestion(this: SuggestModal<T>, value, evt, ...args) {
        // super.selectSuggestion call onClose before onChooseSelection
        // so we need to resolve the promise before calling original method
        resolve(value === null ? { value, evt } : null);
        return next.call(this, value, evt, ...args);
      },
    onClose: (next) =>
      function onClose(this: SuggestModal<T>, ...args) {
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
