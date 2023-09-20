import type { Request } from "../../common/interface.js";
import WorkerHandler from "../handler.js";
import type { WorkerCompat } from "../interface.js";

export default abstract class IframeWorkerHandler extends WorkerHandler {
  abstract get code(): string;

  setupWorker(): WorkerCompat {
    const iframe = createIFrame();
    document.body.appendChild(iframe);
    const load = async (doc: Document) => {
      const baseScript = doc.createElement("script");
      baseScript.textContent = `
window.postMessage=(message,origin)=>{parent.postMessage(message,origin??"*")};
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
      const [baseReady, mainReady] = [baseScript, mainScript].map(
        (script) =>
          new Promise<void>((resolve, reject) => {
            script.addEventListener("load", () => resolve());
            script.addEventListener("error", (ev) => reject(ev.error));
          }),
      );
      doc.head.appendChild(baseScript);
      doc.body.appendChild(mainScript);
      await Promise.all([baseReady, mainReady]);
    };
    return {
      readyPromise: load(iframe.contentDocument!).then(() => true),
      terminate: () => iframe.remove(),
      killed: false,
      addEventListener: iframe.addEventListener.bind(iframe),
      removeEventListener: iframe.removeEventListener.bind(iframe),
      postMessage(message: any, transfer?: any) {
        iframe.contentWindow?.postMessage(message, "*", transfer);
      },
      send(data: Request, opts?: StructuredSerializeOptions) {
        iframe.contentWindow?.postMessage(data, "*", opts?.transfer);
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
