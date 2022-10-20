/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-rest-params */
import type ZoteroPlugin from "../../zt-main";

export interface Context {
  sourcePath?: string | null;
  plugin: ZoteroPlugin;
}

const helperRevokeMap = new WeakMap<any, () => void>();

export const revokeHelper = (proxy: any) => {
  helperRevokeMap.get(proxy)?.();
};

export const bindRevoke = (proxy: any, ...related: any[]) => {
  const selfRevoke = helperRevokeMap.get(proxy);
  helperRevokeMap.set(proxy, () => {
    selfRevoke?.();
    // revoke all related proxies
    related.forEach(revokeHelper);
  });
};

export const withHelper = <
  D extends object,
  E extends Record<string, any>,
  G extends Record<string, (this: D) => any>,
>(
  data: D,
  // context: Context,
  extra?: E,
  getters?: G,
) => {
  const { proxy, revoke } = Proxy.revocable(data, {
    get(_target, prop) {
      if (getters && prop in getters) {
        return getters[prop as keyof typeof getters].call(data);
      }
      if (extra && prop in extra) {
        return extra[prop as keyof typeof extra];
      }
      // @ts-ignore
      return Reflect.get(...arguments); // ?? context[prop];
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      if (extra) keys.push(...Reflect.ownKeys(extra));
      if (getters) keys.push(...Reflect.ownKeys(getters));
      // keys.sort();
      return keys;
    },
  });
  helperRevokeMap.set(proxy, revoke);
  return proxy as D & E & { [key in keyof G]: ReturnType<G[key]> }; // & Context;
};
