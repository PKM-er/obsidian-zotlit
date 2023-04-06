import type { TagInfo } from "@obzt/database";
// import type { Context } from "./base";
import { Proxied, isProxied } from "./base";

export type TagHelper = Readonly<TagInfo>;

export function withTagHelper<T extends TagInfo | null>(
  data: T,
  // ctx: Context,
) {
  if (!data || isProxied(data)) return data;
  return new Proxy(
    {
      toString() {
        return data.name;
      },
    },
    {
      get(target, p, receiver) {
        if (p === Proxied) return true;
        return (
          Reflect.get(target, p, receiver) ?? Reflect.get(data, p, receiver)
        );
      },
      ownKeys(target) {
        return [...Reflect.ownKeys(data), ...Reflect.ownKeys(target)];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (Object.prototype.hasOwnProperty.call(data, prop)) {
          return Reflect.getOwnPropertyDescriptor(data, prop);
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    },
  ) as unknown as TagHelper;
}
