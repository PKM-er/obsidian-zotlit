import type { ShouldExpandNodeInitially } from "react-json-tree";

const neverExpand = new Set(["sortIndex"]),
  noExpandIfLarge = new Set(["creators", "tags"]),
  alwaysExpand = new Set(["position"]);
export const shouldExpandNode: ShouldExpandNodeInitially = (
  keyPath: readonly (string | number)[],
  data: unknown,
  level: number,
) => {
  const first = keyPath[0] as never;
  if (
    neverExpand.has(first) ||
    (noExpandIfLarge.has(first) && Array.isArray(data) && data.length > 6)
  )
    return false;
  if (
    alwaysExpand.has(first) ||
    level < 1 ||
    (level < 2 && Array.isArray(data) && data.length > 1)
  )
    return true;
  return false;
};
