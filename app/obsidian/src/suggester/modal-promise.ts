import type { FuzzyMatch } from "obsidian";
import { FuzzySuggestModal, SuggestModal } from "obsidian";

type ModalResult<T> = { value: T; evt: MouseEvent | KeyboardEvent };

export const isAlternative = (evt: KeyboardEvent | MouseEvent) => evt.shiftKey;

export abstract class SuggestModalWithPromise<T> extends SuggestModal<T> {
  open(): Promise<ModalResult<T> | null> {
    super.open();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    return this.promise;
  }

  resolve: ((value: ModalResult<T> | null) => void) | null = null;
  promise: Promise<ModalResult<T> | null> | null = null;

  onClose() {
    if (this.resolve) {
      this.resolve(null);
      this.resolve = null;
    }
  }

  onChooseSuggestion(): void {
    // console.log(suggestion);
  }

  selectSuggestion(value: T | null, evt: MouseEvent | KeyboardEvent): void {
    if (this.resolve) {
      if (value) {
        this.resolve({ value: value, evt });
      } else {
        this.resolve(null);
      }
      this.resolve = null;
    }

    super.selectSuggestion(value as never, evt);
  }
}

export abstract class FuzzySuggestModalWithPromise<
  T,
> extends FuzzySuggestModal<T> {
  open(): Promise<ModalResult<FuzzyMatch<T>> | null> {
    super.open();
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    return this.promise;
  }

  resolve: ((value: ModalResult<FuzzyMatch<T>> | null) => void) | null = null;
  promise: Promise<ModalResult<FuzzyMatch<T>> | null> | null = null;

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
    value: FuzzyMatch<T>,
    evt: MouseEvent | KeyboardEvent,
  ): void {
    if (this.resolve) {
      if (value) {
        this.resolve({ value: value, evt });
      } else {
        this.resolve(null);
      }
      this.resolve = null;
    }

    super.selectSuggestion(value as never, evt);
  }
}
