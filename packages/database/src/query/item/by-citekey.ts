import { getItemsFromBibtexCitekey } from "../bibtex";
import { getItemsById } from "./by-id";

export function getItemsFromCitekey(citekeys: string[]) {
  const itemIdsByCitekey = getItemsFromBibtexCitekey({ citekeys });
  const itemIds = citekeys
    .map((citekey) => itemIdsByCitekey.get(citekey))
    .filter((v) => !!v);
  const itemsById = getItemsById({ items: itemIds });
  return new Map(
    citekeys
      .map((citekey) => {
        const item = itemIdsByCitekey.get(citekey);
        if (!item) return null;
        return [citekey, itemsById.get(item.itemId)] as const;
      })
      .filter((v) => !!v),
  );
}
