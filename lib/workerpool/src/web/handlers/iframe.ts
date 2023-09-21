import type { Request } from "../../common/interface.js";
import WorkerHandler from "../handler.js";
import type { WorkerCompat } from "../interface.js";

const appDomain = "app://obsidian.md";

export default abstract class IframeWorkerHandler extends WorkerHandler {
  abstract get code(): string;

  setupWorker(): WorkerCompat {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const iframe = createIFrame();
    document.body.appendChild(iframe);
    const load = async (doc: Document) => {
      const baseScript = doc.createElement("script");
      baseScript.textContent = `
window.importScripts=(...urls) => urls.reduce(
(promise, url) => (
  promise.then(() => new Promise(resolve => {
    const script = document.createElement("script")
    script.src = url
    script.addEventListener("load", () => resolve())
    document.body.appendChild(script)
  }))
), Promise.resolve());
addEventListener("error",ev=>{parent.dispatchEvent(new ErrorEvent("error",{filename:"",error:ev.error}))})
        `.trim();
      const mainScript = doc.createElement("script");
      mainScript.type = "module";
      mainScript.textContent = this.code;
      doc.head.appendChild(baseScript);
      doc.body.appendChild(mainScript);
    };

    load(iframe.contentDocument!);
    return {
      readyPromise: new Promise((resolve) =>
        self.internal.once("ready", () => resolve(true)),
      ),
      terminate: () => iframe.remove(),
      killed: false,
      onMessage(callback) {
        const cb = (evt: MessageEvent) => {
          if (evt.source !== iframe.contentWindow) return;
          callback(evt);
        };
        window.addEventListener("message", cb);
        return () => window.removeEventListener("message", cb);
      },
      onError(callback) {
        const win = iframe.contentWindow;
        if (!win) return () => void 0;
        win.addEventListener("error", callback);
        return () => win.removeEventListener("error", callback);
      },
      postMessage(message: any, transfer?: any) {
        iframe.contentWindow?.postMessage(message, appDomain, transfer);
      },
      send(data: Request, opts?: StructuredSerializeOptions) {
        iframe.contentWindow?.postMessage(data, appDomain, opts?.transfer);
      },
    };
  }
}
function createIFrame() {
  const iframe = document.createElement("iframe");
  iframe.style.width = iframe.style.height = iframe.style.border = "0";
  iframe.classList.add("iframe-worker");
  iframe.style.display = "contents";
  return iframe;
}
