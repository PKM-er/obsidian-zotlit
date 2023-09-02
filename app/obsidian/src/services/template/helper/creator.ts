import type { ItemCreator } from "@obzt/database";
import { getCreatorName } from "@obzt/database";

type Creator = Omit<ItemCreator, "itemID">;

export type CreatorHelper = Readonly<
  Creator & {
    fullname: string;
  }
>;

export const withCreatorHelper = (data: Creator) => {
  const proxy = {
    get fullname(): string {
      return getCreatorName(data) ?? "";
    },
    toString() {
      return this.fullname;
    },
    toJSON() {
      return this.fullname;
    },
  };
  return new Proxy(proxy, {
    get(target, p, receiver) {
      // proxy properties should override properties of data
      return Reflect.get(target, p, receiver) ?? Reflect.get(data, p, receiver);
    },
    ownKeys(target) {
      return [
        ...Reflect.ownKeys(data),
        ...Reflect.ownKeys(target).filter(
          (v) => !(v === "toJSON" || v === "toString"),
        ),
      ];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        return Reflect.getOwnPropertyDescriptor(data, prop);
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  }) as unknown as CreatorHelper;
};
