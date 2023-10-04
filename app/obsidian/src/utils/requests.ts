import { deferred } from "@ophidian/core";
import { debounce } from "obsidian";

export default class Requests<T> {
  #deferred = deferred<T[]>();
  #debouncedRequest = debounce(this.#request.bind(this));
  #request() {
    this.#deferred.resolve(this.#pendingRequests);
    this.#pendingRequests = [];
    this.#deferred = deferred();
  }

  #pendingRequests: T[] = [];
  run(req: T): Promise<T[]> {
    this.#pendingRequests.push(req);
    this.#debouncedRequest();
    return this.#deferred.promise;
  }

  get pending() {
    return this.#pendingRequests.length > 0;
  }
}
