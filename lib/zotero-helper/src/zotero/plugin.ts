/* eslint-disable no-var */
import "core-js/actual/object/from-entries.js";

import { icons, id, idShort, version } from "@manifest";
import { enumerate } from "@obzt/common";

import type { Emitter } from "nanoevents";
import { createNanoEvents } from "nanoevents";
import type {
  ZoteroEventMap,
  ZoteroEvents,
  ZoteroEventWarpper,
} from "./events.js";
import type { MenuSelector } from "./menu/menu.js";
import { Menu } from "./menu/menu.js";
import { Component } from "./misc.js";
import { polyfill } from "./polyfill/index.js";
import type { Zotero7 } from "./polyfill/index.js";
import { PreferencePane } from "./pref/index.js";
import type { ReaderEvent } from "./reader/event.js";
import { ReaderEventHelper } from "./reader/event.js";
import { ReaderMenuHelper } from "./reader/menu.js";
import type { AnnotPopupData } from "./reader/menu.js";
import type { IPaneDescriptor } from "./index.js";

declare global {
  var mainWindow: typeof window;
  var mainDocument: typeof window.document;
}

const eventSources = enumerate<_ZoteroTypes.Notifier.Type>()(
  "collection",
  "search",
  "share",
  "share-items",
  "item",
  "file",
  "collection-item",
  "item-tag",
  "tag",
  "setting",
  "group",
  "trash",
  "bucket",
  "relation",
  "feed",
  "feedItem",
  "sync",
  "api-key",
  "tab",
);

const toPrefID = (name: string) => `extensions.${idShort}.${name}`;

abstract class Plugin_2<
  Settings extends Record<string, any>,
> extends Component {
  public manifest?: Manifest;
  public version = version;
  public id = {
    full: id,
    short: idShort,
  };
  public icons = icons;
  /**
   * https://contest-server.cs.uchicago.edu/ref/JavaScript/developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.html
   * The Services.jsm JavaScript code module offers a wide assortment of lazy getters that simplify the process of obtaining references to commonly used services.
   */
  public Services?: any;

  public app: Zotero7;
  // private stringBundle?: {
  //   GetStringFromName: (name: string) => string;
  // };

  public settings: Settings;

  get loaded() {
    return this.manifest !== undefined;
  }
  getResourceURL(...paths: string[]) {
    if (!this.manifest) {
      throw new Error("Plugin is not loaded");
    }
    return this.manifest.rootURI + paths.join("/").replace(/^\/{2,}/g, "/");
  }
  constructor(app: typeof Zotero) {
    super();
    this.app = app as Zotero7;
    Object.defineProperties(globalThis, {
      mainWindow: {
        get() {
          return app.getMainWindow();
        },
        configurable: true,
      },
      mainDocument: {
        get() {
          return app.getMainWindow().document;
        },
        configurable: true,
      },
    });
    this.register(() => {
      // @ts-ignore
      delete globalThis.mainWindow;
      // @ts-ignore
      delete globalThis.mainDocument;
    });
    this.settings = new Proxy({} as Settings, {
      get(target, p, receiver) {
        if (typeof p === "string") {
          return app.Prefs.get(toPrefID(p), true);
        }
        return Reflect.get(target, p, receiver);
      },
      set(target, p, value, receiver) {
        if (typeof p === "string") {
          return app.Prefs.set(toPrefID(p), value, true);
        }
        return Reflect.set(target, p, value, receiver);
      },
      deleteProperty(target, p) {
        if (typeof p === "string") {
          return app.Prefs.clear(toPrefID(p), true), true;
        }
        return Reflect.deleteProperty(target, p);
      },
    });
  }

  polyfillUnloader?: () => void;
  load(manifest: Manifest, Services: any) {
    this.manifest = manifest;
    this.Services = Services;
    const { Zotero, unload } = polyfill({
      Zotero: this.app,
      Services,
    });
    this.app = Zotero;
    this.polyfillUnloader = unload;
    super.load(manifest, Services);
  }
  abstract onload(manifest: Manifest, services: any): void;
  unload(): void {
    super.unload();
    delete this.manifest;
    this.polyfillUnloader?.();
  }
  async install() {
    await this.onInstall();
  }
  async uninstall() {
    await this.onUninstall();
  }
  abstract onInstall(): Promise<void> | void;
  abstract onUninstall(): Promise<void> | void;

  // #region events
  #events = Object.fromEntries(
    eventSources.map((e) => [e, null as Emitter | null] as const),
  );
  events = new Proxy(this.#events, {
    get(target, p, receiver) {
      if (typeof p === "string" && target[p] === null) {
        throw new Error(`Notifier for event source ${p} is not registered`);
      }
      return Reflect.get(target, p, receiver);
    },
  }) as ZoteroEventWarpper;

  registerNotifier<T extends ZoteroEvents>(types: T[]) {
    types
      .filter((type) => this.#events[type] === null)
      .map((type) => {
        const emitter = createNanoEvents<ZoteroEventMap<T>>();
        this.#events[type] = emitter;
        const notifierID = this.app.Notifier.registerObserver(
          {
            notify: (event, _type, ids, extraData) => {
              // @ts-ignore
              emitter.emit(event, ids, extraData);
            },
          },
          [type],
          `${id}-${type}`,
        );
        return [type, notifierID] as const;
      })
      .forEach(([type, notifierID]) =>
        this.register(() => {
          this.app.Notifier.unregisterObserver(notifierID);
          this.#events[type] = null;
        }),
      );
  }

  registerPref<K extends keyof Settings>(
    name: K,
    callback: (value: K) => void,
    immediate = false,
  ) {
    const _callback = () => callback(this.settings[name]);
    const id = this.app.Prefs.registerObserver(
      toPrefID(name as string),
      _callback,
    );
    if (immediate) {
      _callback();
    }
    this.register(() => {
      this.app.Prefs.unregisterObserver(id);
    });
  }
  // #endregion

  #readerEvent?: ReaderEventHelper;

  registerReaderEvent<K extends keyof ReaderEvent>(key: K, cb: ReaderEvent[K]) {
    if (!this.loaded) throw new Error("registerReaderEvent before loaded");

    this.#readerEvent ??= this.addChild(new ReaderEventHelper(this.app));
    this.register(this.#readerEvent.event.on(key, cb));
  }

  // # menu
  #readerMenu?: ReaderMenuHelper;
  registerMenu(
    selector: "reader",
    cb: (
      menu: Menu,
      data: AnnotPopupData,
      reader: _ZoteroTypes.ReaderInstance,
    ) => any,
  ): void;
  registerMenu(
    selector: keyof typeof MenuSelector,
    cb: (menu: Menu) => any,
  ): void;
  registerMenu(selector: string, cb: (menu: Menu) => any): void;
  registerMenu(
    selector: string,
    cb: (menu: Menu, ...args: any[]) => any,
  ): void {
    if (selector === "reader") {
      if (!this.loaded) throw new Error("register reader Menu before loaded");
      this.#readerMenu ??= this.addChild(new ReaderMenuHelper(this.app));
      this.register(this.#readerMenu.event.on("menu", cb));
    } else {
      const menu = this.addChild(new Menu({ selector }));
      cb(menu);
    }
  }

  registerPrefPane(des: IPaneDescriptor) {
    if (!this.loaded) {
      throw new Error("Plugin is not loaded");
    }
    this.addChild(new PreferencePane(des, this.app));
  }
}

export interface Manifest {
  id: string;
  version: string;
  resourceURI: unknown;
  rootURI: string;
}

export { Plugin_2 as Plugin };
