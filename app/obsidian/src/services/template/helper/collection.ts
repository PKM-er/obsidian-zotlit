import type { Collection } from "@obzt/database";

export type CollectionHelper = Readonly<Collection>;

class CollectionPath extends Array {
  toString(): string {
    return this.join(" > ");
  }
}

export const withCollectionHelper = ({ path: _path, ...data }: Collection) => {
  const proxy = {
    path: CollectionPath.from(_path),
    toString() {
      return data.name;
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
  }) as unknown as CollectionHelper;
};
