import type { RegularItemInfo } from "@obzt/database";
import type { DbWorkerAPI } from "@obzt/database/dist/api";
import { assertNever } from "assert-never";
import { cache } from "@init";

const getItem = (
  item: string | number,
  libId: number,
): RegularItemInfo | null => {
  let result;
  if (typeof item === "number") {
    const idIndex = cache.items.get(libId)?.byId;
    if (!idIndex) throw new Error("Query before init");
    result = idIndex[item];
  } else if (typeof item === "string") {
    const keyIndex = cache.items.get(libId)?.byKey;
    if (!keyIndex) throw new Error("Query before init");
    result = keyIndex[item];
  } else assertNever(item);
  return result ?? null;
};

export const getItems: DbWorkerAPI["getItems"] = (items) =>
  items.map(([keyOrID, libId]) => getItem(keyOrID, libId));
