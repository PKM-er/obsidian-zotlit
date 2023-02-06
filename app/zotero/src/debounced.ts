import { debounce } from "@mobily/ts-belt/Function";

export abstract class Debouncer<Data, ID> {
  #queue = new Map<ID, Data>();

  request(id: ID, data: Data): void {
    this.#queue.set(id, data);
    this.#request();
  }

  abstract notify(data: [ID, Data][]): Promise<void> | void;

  #request = debounce(async () => {
    if (this.#queue.size === 0) return;
    const task = this.notify(Array.from(this.#queue.entries()));
    this.#queue.clear();
    // capture error
    await task;
  }, 500);

  static create<Data, ID>(
    notify: (data: [ID, Data][]) => Promise<void> | void,
  ): Debouncer<Data, ID>["request"] {
    const debouncer = new (class extends Debouncer<Data, ID> {
      notify = notify;
    })();
    return debouncer.request.bind(debouncer);
  }
}
