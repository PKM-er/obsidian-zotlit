import dedent from "dedent";
import { Platform } from "obsidian";

import type { Item } from "../zotero-types";

export const promptOpenLog = () => dedent`
Press ${Platform.isMacOS ? "⌘ Cmd" : "Ctrl"} + ${
  Platform.isMacOS ? "⌥ Option" : "Shift"
} + I, then go to the "Console" tab to see the log.`;

export * from "./zotero-date";

export const checkNodeInWorker = () => {
  const url = URL.createObjectURL(
    new Blob(['self.postMessage("require" in self); self.close()'], {
      type: "text/javascript",
    }),
  );
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return new Promise<boolean>((resolve, reject) => {
    worker.onmessage = (e) => {
      resolve(e.data ?? false), worker.terminate();
    };
    worker.onerror = (e) => {
      resolve(false), console.error(e), worker.terminate();
    };
    worker.onmessageerror = (e) => {
      resolve(false), console.error(e), worker.terminate();
    };
  });
};

export const getItemKeyLibID = (
  ...args: [item: Item] | [key: string, libraryID: string]
) =>
  args.length === 1
    ? `${args[0].key}l${args[0].libraryID}`
    : `${args[0]}l${args[1]}`;
