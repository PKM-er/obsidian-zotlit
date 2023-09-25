import { fromScriptText } from "@aidenlx/esbuild-plugin-inline-worker/utils";
import type { ProxyMethods, WorkerHandler } from "@aidenlx/workerpool";
import { WebWorkerHandler, WorkerPool } from "@aidenlx/workerpool";
import type { AnnotationInfo } from "@obzt/database";
import { AnnotationType } from "@obzt/zotero-type";
import { Service } from "@ophidian/core";

import type { App } from "obsidian";
import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import workerCode from "worker:@/worker-web/annot-block/main";

import log, { logError } from "@/log";
import type { ZoteroDatabase } from "@/services/zotero-db/database";
import type {
  AnnotBlockWorkerAPI,
  AnnotDetails,
  AnnotInfo,
} from "@/worker-web/annot-block/api";
import ZoteroPlugin from "@/zt-main";

class AnnotBlockWorker extends WebWorkerHandler {
  initWebWorker(): Worker {
    return fromScriptText(workerCode, {
      name: "zotlit annot block worker",
    });
  }
}
class AnnotBlockWorkerPool extends WorkerPool<AnnotBlockWorkerAPI> {
  workerCtor(): WorkerHandler {
    return new AnnotBlockWorker();
  }
}

export class AnnotBlock extends Service {
  plugin = this.use(ZoteroPlugin);

  #instance = new AnnotBlockWorkerPool();

  get api() {
    return this.#instance.proxy;
  }

  onload(): void {
    this.plugin.registerMarkdownCodeBlockProcessor(
      "zotero-annot",
      (source, el, ctx) => {
        const child = new AnnotBlockRenderChild(
          el,
          this.plugin.database,
          this.api,
          this.plugin.app,
        );
        ctx.addChild(child);
        child.load();
        child.render([source, ctx.sourcePath]);
      },
    );
  }
  async onunload(): Promise<void> {
    await this.#instance.terminate();
  }

  async parse(markdown: string) {
    return await this.api.parse(markdown);
  }

  async stringify(spec: AnnotDetails[]) {
    return await this.api.stringify(spec);
  }
}

class AnnotBlockRenderChild extends MarkdownRenderChild {
  constructor(
    container: HTMLElement,
    private db: ZoteroDatabase,
    private worker: ProxyMethods<AnnotBlockWorkerAPI>,
    public app: App,
  ) {
    super(container);
  }

  private cache:
    | [info: AnnotInfo[], sourcePath: string, source: string]
    | null = null;
  async render(spec?: [source: string, sourcePath: string]) {
    this.containerEl.empty();
    let info: AnnotInfo[], sourcePath: string, source: string;
    if (spec) {
      [source, sourcePath] = spec;
      this.cache = null;
      info = (await this.worker.parse(source)).annots;
      this.cache = [info, sourcePath, source];
    } else if (this.cache) {
      [info, sourcePath, source] = this.cache;
    } else {
      log.debug("Cannot render without spec or cache");
      return;
    }
    let markdown: string;
    try {
      const annotations = await this.db.api.getAnnotFromKey(
        info.map(({ annotKey }) => annotKey),
        this.db.settings.citationLibrary,
      );

      const annotDetails = info.map(({ annotKey, ...props }) => ({
        ...props,
        annotKey,
        text:
          annotations[annotKey] && isTextExcerpt(annotations[annotKey])
            ? annotations[annotKey].text ?? ""
            : "",
      }));
      markdown = await this.worker.stringify(annotDetails);
    } catch (error) {
      logError("stringify annots", error);
      markdown = source;
    }
    await MarkdownRenderer.render(
      this.app,
      markdown,
      this.containerEl,
      sourcePath,
      this,
    );
  }
  onload(): void {
    // safe to load this before first render
    // if db refresh before first render, render will be skipped
    this.registerEvent(
      this.app.vault.on("zotero:db-refresh", this.render.bind(this)),
    );
  }
}

function isTextExcerpt(annot: AnnotationInfo): boolean {
  return (
    annot.type === AnnotationType.highlight ||
    annot.type === AnnotationType.underline
  );
}
