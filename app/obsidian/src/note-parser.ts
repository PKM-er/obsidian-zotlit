import workerpool from "@aidenlx/workerpool";
import noteParserWorker from "@obzt/note-parser";
import type { NoteParserWorkerAPI } from "@obzt/note-parser";

import { Events } from "obsidian";
import log from "./logger.js";
import type ZoteroPlugin from "./zt-main.js";

export default class NoteParser extends Events {
  // itemMap: Record<string, RegularItem> = {};

  #pool: workerpool.WorkerPool;
  #proxy: workerpool.Promise<workerpool.Proxy<NoteParserWorkerAPI>, Error>;
  #plugin: ZoteroPlugin;
  constructor(plugin: ZoteroPlugin) {
    super();
    this.#plugin = plugin;
    const script = noteParserWorker();
    this.#pool = workerpool.pool(script, {
      minWorkers: 1,
      maxWorkers: 4,
      workerType: "iframe",
    });
    this.#proxy = this.#pool.proxy();
    plugin.register(() => {
      URL.revokeObjectURL(script);
      this.close();
    });

    if (process.env.NODE_ENV === "development") {
      // expose proxy in dev env
      Object.defineProperty(this, "proxy", {
        get() {
          return this.#proxy;
        },
      });
    }
  }

  async parse(html: string): Promise<string> {
    const proxy = await this.#proxy;
    return proxy.parse(html);
  }

  close(force = false) {
    this.#pool.terminate(force);
    log.info("Zotero note parser unloaded");
  }
}
