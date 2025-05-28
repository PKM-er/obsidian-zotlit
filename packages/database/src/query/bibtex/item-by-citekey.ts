import { getItemsFromBibtexCitekey } from "./from-citekey";
import { getItemsById } from "../item/by-id";

/**
 * Get Zotero items by their citation keys
 * @param citekeys Array of citation keys to query
 * @returns Map of citation keys to their corresponding items
 * @remarks The returned map's keys are the citation keys from the database,
 * which may not exactly match the input array's citekeys. This is because internally it performs a case-insensitive query.
 */
export async function getItemsByCitekey(citekeys: string[]) {
  const itemIdsByCitekey = await getItemsFromBibtexCitekey({ citekeys });
  const itemIds = [...itemIdsByCitekey.values()];
  const itemsById = await getItemsById({ items: itemIds });
  return new Map(
    itemIds.map(({ itemId, citekey }) => [citekey, itemsById.get(itemId)]),
  );
}
