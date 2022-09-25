import endent from "endent";
import { Platform } from "obsidian";

export const promptOpenLog = () => endent.default`
Press ${Platform.isMacOS ? "⌘ Cmd" : "Ctrl"} + ${
  Platform.isMacOS ? "⌥ Option" : "Shift"
} + I, then go to the "Console" tab to see the log.`;
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
