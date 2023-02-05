import type { App, EventRef } from "obsidian";
import { debounce } from "obsidian";

export const untilMetaReady = (
  app: App,
  options: Omit<WaitUntilOptions, "register" | "unregister" | "escape">,
) =>
  waitUntil({
    ...options,
    register: (cb) => app.metadataCache.on("initialized", cb),
    unregister: (ref) => app.metadataCache.offref(ref),
    escape: () => app.metadataCache.initialized,
    timeout: options.timeout ?? null,
  });

export const untilDbRefreshed = (
  app: App,
  options: Omit<WaitUntilOptions, "register" | "unregister">,
) =>
  waitUntil({
    ...options,
    register: (cb) => app.vault.on("zotero:db-refresh", cb),
    unregister: (ref) => app.vault.offref(ref),
  });

interface WaitUntilOptions {
  register: (callback: () => void) => EventRef;
  onRegister?: (ref: EventRef) => any;
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
  onRegister,
  escape,
  timeout = 10e3,
  waitAfterEvent,
  debounce: debounceTime = 1e3,
}: WaitUntilOptions) =>
  new Promise<void>((_resolve, reject) => {
    if (escape?.()) {
      _resolve();
      return;
    }
    const unload = async () => {
      if (waitAfterEvent !== undefined) {
        await sleep(waitAfterEvent);
      }
      unregister(ref), _resolve();
    };
    const handleEvent = debounceTime
      ? debounce(unload, debounceTime, true)
      : unload;

    const ref = register(handleEvent);
    onRegister?.(ref);
    if (timeout === null) return;
    sleep(timeout).then(() => {
      unregister(ref);
      reject(new Error("timeout"));
    });
  });
