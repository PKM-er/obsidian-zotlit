import type { IDLibID, RegularItemInfo } from "@obzt/database";
import type { KeyLibID } from "@obzt/database/utils";
import { assertNever } from "assert-never";
// import { use } from "to-use";
import { index } from "../globals";

const isItemKeys = (items: IDLibID[] | KeyLibID[]): items is KeyLibID[] =>
  typeof items[0][0] === "string";

export function uniq<T>(arr: T[]) {
  return [...new Set(arr)];
}

export default class ItemFetcher {
  #index = index;

  async get(
    items: IDLibID[] | KeyLibID[],
    forceUpdate?: boolean,
  ): Promise<(RegularItemInfo | null)[]> {
    if (items.length === 0) return [];
    if (!forceUpdate) {
      const result = await Promise.all(
        items.map(([keyOrID, libId]) => this.#fromCache(keyOrID, libId)),
      );
      return result;
    }
    const itemIDObjectMap = isItemKeys(items)
      ? this.#index.readItemByKey(items)
      : this.#index.readItemById(items);

    await this.#index.updateIndex(itemIDObjectMap);
    return Object.values(itemIDObjectMap);
  }

  async #fromCache(
    item: string | number,
    libId: number,
  ): Promise<RegularItemInfo | null> {
    const cache = await this.#index.getItemsCache(libId);
    if (typeof item === "number") {
      return cache.byId.get(item) ?? null;
    } else if (typeof item === "string") {
      return cache.byKey.get(item) ?? null;
    } else assertNever(item);
    return null;
  }
}
