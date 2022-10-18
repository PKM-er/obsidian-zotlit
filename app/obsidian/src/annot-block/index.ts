import workerpool from "@aidenlx/workerpool";
import type { AnnotBlockWorkerAPI } from "@obzt/annot-block";
import annotBlockWorker from "@obzt/annot-block";
import type { AnnotDetails, AnnotInfo } from "@obzt/annot-block/dist/api";
import { AnnotationType } from "@obzt/zotero-type";
import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import log from "../logger";
import type ZoteroDb from "../zotero-db";
import type ZoteroPlugin from "../zt-main";

class AnnotBlockRenderChild extends MarkdownRenderChild {
  constructor(
    container: HTMLElement,
    private db: ZoteroDb,
    private worker: AnnotBlockWorkerAPI,
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
      const annotations = await this.db.getAnnotFromKey(
        info.map(({ annotKey }) => annotKey),
      );
      markdown = await this.worker.stringify(
        info.map(({ annotKey, ...props }) => ({
          ...props,
          annotKey,
          text:
            annotations[annotKey]?.type === AnnotationType.highlight
              ? annotations[annotKey].text ?? ""
              : "",
        })),
      );
    } catch (error) {
      log.error("Failed to stringify annots", error);
      markdown = source;
    }
    await MarkdownRenderer.renderMarkdown(
      markdown,
      this.containerEl,
      sourcePath,
      this,
    );
  }
  onload(): void {
    // safe to load this before first render
    // if db refresh before first render, render will be skipped
    this.registerEvent(this.db.on("refresh", this.render.bind(this)));
  }
}

export const registerCodeBlock = (plugin: ZoteroPlugin) => {
  plugin.registerMarkdownCodeBlockProcessor(
    "zotero-annot",
    (source, el, ctx) => {
      const child = new AnnotBlockRenderChild(
        el,
        plugin.db,
        plugin.annotBlockWorker,
      );
      ctx.addChild(child);
      child.load();
      child.render([source, ctx.sourcePath]);
    },
  );
};

export class AnnotBlockWorker {
  pool: workerpool.WorkerPool;
  proxy: workerpool.Promise<workerpool.Proxy<AnnotBlockWorkerAPI>, Error>;

  constructor(public plugin: ZoteroPlugin) {
    this.pool = workerpool.pool(annotBlockWorker(), {
      workerType: "web",
    });
    this.proxy = this.pool.proxy();
  }

  async parse(markdown: string) {
    const proxy = await this.proxy;
    return proxy.parse(markdown);
  }

  async stringify(spec: AnnotDetails[]) {
    const proxy = await this.proxy;
    return proxy.stringify(spec);
  }
}
