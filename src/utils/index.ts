import type { ItemType } from "../zotero-types";
export * from "./zotero-date";

/**
 * @param index set to true to generate key without praentItem to be used for indexing
 * @returns ITEMKEY(gGROUPID) / ANNOT_KEYaATTACHMENT_KEY(gGROUPID)
 */
export const getItemKeyGroupID = (
  {
    key,
    groupID,
    parentItem,
    itemType = "journalArticle",
  }: {
    key: string;
    groupID?: number;
    parentItem?: string;
    itemType?: ItemType;
  },
  index = false,
) => {
  const suffix = typeof groupID === "number" ? `g${groupID}` : "";
  if (!index && itemType === "annotation") {
    if (!parentItem)
      throw new Error(
        "parentItem is required for creating annotation zotero key",
      );
    return `${key}a${parentItem}${suffix}`;
  } else return key + suffix;
};
