import type { ItemCreator } from "@obzt/database";
import { getCreatorName } from "@obzt/database";

type Creator = Omit<ItemCreator, "itemID">;

export type CreatorHelper = Readonly<
  Creator & {
    fullname: string;
  }
>;

export const withCreatorHelper = (data: Creator) =>
  new Proxy(
    {
      get fullname(): string {
        return getCreatorName(data) ?? "";
      },
    },
    {
      get(target, p, receiver) {
        return (
          Reflect.get(data, p, receiver) ?? Reflect.get(target, p, receiver)
        );
      },
      ownKeys(target) {
        return [...Reflect.ownKeys(data), ...Reflect.ownKeys(target)];
      },
    },
  ) as unknown as CreatorHelper;
