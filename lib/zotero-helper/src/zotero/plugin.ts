/* eslint-disable no-var */
import "core-js/actual/object/from-entries.js";

import { enumerate } from "@obzt/common";
import type { Emitter } from "nanoevents";
import { createNanoEvents } from "nanoevents";
import type { MenuSelector } from "./menu/menu.js";
import { Menu } from "./menu/menu.js";
import type { AnnotPopupData } from "./menu/reader-menu.js";
import { ReaderMenuHelper } from "./menu/reader-menu.js";
import { Component } from "./misc.js";

declare global {
  var mainWindow: typeof window;
  var mainDocument: typeof window.document;
}

type ZoteroEvent = Record<
  _ZoteroTypes.Notifier.Event,
  (ids: string[], extraData: _ZoteroTypes.anyObj) => any
>;

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

abstract class Plugin_2 extends Component {
  public manifest?: Manifest;
  /**
   * https://contest-server.cs.uchicago.edu/ref/JavaScript/developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.html
   * The Services.jsm JavaScript code module offers a wide assortment of lazy getters that simplify the process of obtaining references to commonly used services.
   */
  public service?: any;
  // private stringBundle?: {
  //   GetStringFromName: (name: string) => string;
  // };
  get loaded() {
    return this.manifest !== undefined;
  }
  constructor(public app: typeof Zotero) {
    super();
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
    this.#readerHelper = this.addChild(new ReaderMenuHelper(app));
  }

  load(manifest: Manifest, services: any) {
    this.manifest = manifest;
    this.service = services;
    super.load(manifest, services);
  }
  abstract onload(manifest: Manifest, services: any): void;
  unload(): void {
    super.unload();
    delete this.manifest;
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
  }) as Record<_ZoteroTypes.Notifier.Type, Emitter<ZoteroEvent>>;

  registerNotifier(types: _ZoteroTypes.Notifier.Type[]) {
    if (!this.manifest) {
      throw new Error("Plugin is not loaded");
    }
    const { id } = this.manifest;
    types
      .filter((type) => this.#events[type] === null)
      .map((type) => {
        const emitter = createNanoEvents<ZoteroEvent>();
        this.#events[type] = emitter;
        const notifierID = this.app.Notifier.registerObserver(
          {
            notify: (event, _type, ids, extraData) => {
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
  // #endregion

  // # menu
  #readerHelper: ReaderMenuHelper;
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
      this.#readerHelper.registerMenu(cb);
    } else {
      const menu = this.addChild(new Menu(selector));
      cb(menu);
    }
  }
}

export interface Manifest {
  id: string;
  version: string;
  resourceURI: unknown;
  rootURI: string;
}

export { Plugin_2 as Plugin };
