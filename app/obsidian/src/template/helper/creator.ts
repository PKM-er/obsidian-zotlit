import type { ItemCreator } from "@obzt/database";
import { getCreatorName } from "@obzt/database";
import { withHelper } from "./base";

export type CreatorHelper = ReturnType<typeof withCreatorHelper>;
export const withCreatorHelper = (data: Omit<ItemCreator, "itemID">) =>
  withHelper(data, undefined, {
    fullname(): string {
      return getCreatorName(this) ?? "";
    },
  });
