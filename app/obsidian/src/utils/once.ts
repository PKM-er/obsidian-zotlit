import { assertNever } from "assert-never";
import type { App, EventRef } from "obsidian";
import { debounce } from "obsidian";
import { DatabaseStatus } from "../services/zotero-db/connector/service";
import type ZoteroPlugin from "../zt-main";

export function untilMetaReady(
  app: App,
  options: Omit<WaitUntilOptions, "register" | "unregister" | "escape"> = {},
) {
  return waitUntil({
    ...options,
    register: (cb) => app.metadataCache.on("initialized", cb),
    unregister: (ref) => app.metadataCache.offref(ref),
    escape: () => app.metadataCache.initialized,
    timeout: options.timeout ?? null,
  });
}

export function untilDbRefreshed(
  app: App,
  options: Omit<WaitUntilOptions, "register" | "unregister"> = {},
) {
  return waitUntil({
    ...options,
    register: (cb) => app.vault.on("zotero:db-refresh", cb),
    unregister: (ref: EventRef) => app.vault.offref(ref),
  });
}

export function untilZoteroReady(
  plugin: ZoteroPlugin,
  options: Omit<WaitUntilOptions, "register" | "unregister" | "escape"> = {},
) {
  return waitUntil({
    ...options,
    unregister: (ref) => plugin.app.vault.offref(ref),
    escape: () => plugin.dbWorker.status === DatabaseStatus.Ready,
    register: (cb) => {
      const status = plugin.dbWorker.status;
      if (status === DatabaseStatus.NotInitialized) {
        return plugin.app.vault.on("zotero:db-ready", cb);
      } else if (status === DatabaseStatus.Pending) {
        return plugin.app.vault.on("zotero:db-refresh", cb);
      } else if (status === DatabaseStatus.Ready) {
        throw new Error("should not be called when db is ready");
      }
      assertNever(status);
    },
  });
}

interface WaitUntilOptions {
  register: (callback: () => void) => EventRef;
  unregister: (ref: EventRef) => any;
  escape?: () => boolean;
  /** if null, no timeout */
  timeout?: number | null;
  waitAfterEvent?: number;
  debounce?: number | null;
}

export const untilWorkspaceReady = (app: App) =>
  new Promise<void>((resolve) => {
    app.workspace.onLayoutReady(resolve);
  });

export const waitUntil = ({
  register,
  unregister,
  escape,
  timeout = 10e3,
  waitAfterEvent,
  debounce: dTimeout = 1e3,
}: WaitUntilOptions) => {
  let cancel = <(() => void) | null>null;
  const task = new Promise<void>((_resolve, reject) => {
    if (escape?.()) {
      _resolve();
      return;
    }
    cancel = function cancel() {
      unregister(ref);
      reject(new CancelledError());
    };
    function resolve() {
      unregister(ref);
      _resolve();
    }

    async function unload() {
      if (waitAfterEvent !== undefined) {
        await sleep(waitAfterEvent);
      }
      resolve();
    }
    const ref = register(dTimeout ? debounce(unload, dTimeout, true) : unload);

    if (timeout === null) return;
    sleep(timeout).then(() => {
      unregister(ref);
      reject(new TimeoutError(timeout));
    });
  });
  return [task, cancel] as const;
};

export class TimeoutError extends Error {
  constructor(public readonly timeout: number) {
    super(`Timeout after ${timeout}ms`);
  }
}

export class CancelledError extends Error {
  constructor() {
    super("Manually cancelled");
  }
}
