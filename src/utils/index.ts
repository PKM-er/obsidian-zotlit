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

export const getItemKeyGroupID = (
  ...args: [item: Item] | [key: string, groupID: number | undefined]
) => {
  const key = args.length === 1 ? args[0].key : args[0],
    groupID = args.length === 1 ? args[0].groupID : args[1],
    suffix = typeof groupID === "number" ? `g${groupID}` : "";
  return key + suffix;
};
