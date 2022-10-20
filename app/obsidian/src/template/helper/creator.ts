import type { ItemCreator } from "@obzt/zotero-type";
import { getCreatorName } from "@obzt/zotero-type";
import { withHelper } from "./base";

export type CreatorHelper = ReturnType<typeof withCreatorHelper>;
export const withCreatorHelper = (data: Omit<ItemCreator, "itemID">) =>
  withHelper(data, undefined, {
    fullname(): string {
      return getCreatorName(this) ?? "";
    },
  });
