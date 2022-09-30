import assertNever from "assert-never";
import type { DbWorkerAPI } from "@api";
import { itemIdIndex, itemKeyIndex } from "@init";

const query: DbWorkerAPI["getItem"] = async (item, libId) => {
  let result;
  if (typeof item === "number") {
    const idIndex = itemIdIndex[libId];
    if (!idIndex) throw new Error("Query before init");
    result = idIndex[item];
  } else if (typeof item === "string") {
    const keyIndex = itemKeyIndex[libId];
    if (!keyIndex) throw new Error("Query before init");
    result = keyIndex[item];
  } else assertNever(item);
  return result ?? null;
};
export default query;
