export interface ItemKeyGroup {
  key: string;
  groupID?: number | null;
  parentItem?: string;
}

/**
 * @param index set to true to generate key without parentItem to be used for indexing
 * @returns ITEMKEY(gGROUPID) / ANNOT_KEYaATTACHMENT_KEY(gGROUPID)
 */
export const getItemKeyGroupID = (
  { key, groupID, parentItem }: ItemKeyGroup,
  index = false,
) => {
  const parts = [key];
  if (!index && parentItem) {
    // a => at
    parts.push(`a${parentItem}`);
  }
  if (typeof groupID === "number") {
    parts.push(`g${groupID}`);
  }
  return parts.join("");
};
