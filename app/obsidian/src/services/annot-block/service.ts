import workerpool from "@aidenlx/workerpool";
import { toObjectURL } from "@obzt/esbuild-plugin-inline-worker/utils";
import { AnnotationType } from "@obzt/zotero-type";
import { Service } from "@ophidian/core";

import { MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import workerCode from "worker:@/worker/annot-block/main";

import log, { logError } from "@/log";
import type { ZoteroDatabase } from "@/services/zotero-db/database";
import { createWorkerProxy } from "@/utils/worker";
import type {
  AnnotBlockWorkerAPI,
  AnnotDetails,
  AnnotInfo,
} from "@/worker/annot-block";
import ZoteroPlugin from "@/zt-main";

export class AnnotBlock extends Service {
  plugin = this.use(ZoteroPlugin);

  #url = toObjectURL(workerCode);
  #instance = workerpool.pool(this.#url, {
    workerType: "web",
    name: "Zotero Annot Block Worker",
  });

  api = createWorkerProxy<AnnotBlockWorkerAPI>(this.#instance);

  onload(): void {
    this.plugin.registerMarkdownCodeBlockProcessor(
      "zotero-annot",
      (source, el, ctx) => {
        const child = new AnnotBlockRenderChild(el, this.plugin.database, this);
        ctx.addChild(child);
        child.load();
        child.render([source, ctx.sourcePath]);
      },
    );
  }
  async onunload(): Promise<void> {
    await this.#instance.terminate();
    URL.revokeObjectURL(this.#url);
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
      const annotations = await this.db.api.getAnnotFromKey(
        info.map(({ annotKey }) => annotKey),
        this.db.settings.citationLibrary,
      );
      const annotDetails = info.map(({ annotKey, ...props }) => ({
        ...props,
        annotKey,
        text:
          annotations[annotKey]?.type === AnnotationType.highlight
            ? annotations[annotKey].text ?? ""
            : "",
      }));
      markdown = await this.worker.stringify(annotDetails);
    } catch (error) {
      logError("stringify annots", error);
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
    this.registerEvent(
      app.vault.on("zotero:db-refresh", this.render.bind(this)),
    );
  }
}
