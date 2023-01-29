import { PreferencePanesPolyfill } from "../pref/index.js";
import type { PreferencePanes } from "./pref-type.js";

export interface Zotero7 extends _ZoteroTypes.Zotero {
  PreferencePanes: PreferencePanes;
}

export type {
  IPreferencePaneDescriptor,
  PreferencePanes,
} from "./pref-type.js";

export function polyfill(ctx: { Zotero: typeof Zotero; Services: any }): {
  Zotero: Zotero7;
  unload: () => void;
} {
  const PreferencePanes = new PreferencePanesPolyfill(ctx);
  const p = Proxy.revocable(ctx.Zotero as Zotero7, {
    get(target, prop, receiver) {
      if (prop === "PreferencePanes") {
        return PreferencePanes;
      }
      return Reflect.get(target, prop, receiver);
    },
    has(target, p) {
      if (p === "PreferencePanes") {
        return true;
      }
      return Reflect.has(target, p);
    },
    ownKeys(target) {
      return [...Reflect.ownKeys(target), "PreferencePanes"];
    },
    getOwnPropertyDescriptor(target, p) {
      if (p === "PreferencePanes") {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: PreferencePanes,
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, p);
    },
  });
  return {
    Zotero: p.proxy,
    unload: () => {
      p.revoke();
      PreferencePanes.__pp_unload__();
    },
  };
}
