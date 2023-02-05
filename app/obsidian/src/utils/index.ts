import type { TAbstractFile } from "obsidian";
import { Platform, TFile, TFolder } from "obsidian";

export const promptOpenLog = () =>
  `Press ${Platform.isMacOS ? "⌘ Cmd" : "Ctrl"} + ${
    Platform.isMacOS ? "⌥ Option" : "Shift"
  } + I, then go to the "Console" tab to see the log.`;

export function* getAllMarkdownIn(folder: TFolder): IterableIterator<TFile> {
  for (const af of folder.children) {
    if (af instanceof TFolder) {
      yield* getAllMarkdownIn(af);
    } else if (af instanceof TFile && af.extension === "md") {
      yield af;
    }
  }
}

export const isMarkdownFile = (file: TAbstractFile): file is TFile =>
  file instanceof TFile && file.extension === "md";

export const getFilePath = (file: TAbstractFile | string): string =>
  typeof file === "string" ? file : file.path;

// export const checkNodeInWorker = () => {
//   const url = URL.createObjectURL(
//     new Blob(['self.postMessage("require" in self); self.close()'], {
//       type: "text/javascript",
//     }),
//   );
//   const worker = new Worker(url);
//   URL.revokeObjectURL(url);
//   return new Promise<boolean>((resolve, reject) => {
//     worker.onmessage = (e) => {
//       resolve(e.data ?? false), worker.terminate();
//     };
//     worker.onerror = (e) => {
//       resolve(false), console.error(e), worker.terminate();
//     };
//     worker.onmessageerror = (e) => {
//       resolve(false), console.error(e), worker.terminate();
//     };
//   });
// };

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports
  var DOMPurify: typeof import("dompurify");
}
