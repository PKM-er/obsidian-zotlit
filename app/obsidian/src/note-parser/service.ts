import workerpool from "@aidenlx/workerpool";
import { toObjectURL } from "@obzt/esbuild-plugin-inline-worker/utils";
import { Service } from "@ophidian/core";

import workerCode from "worker:@/worker/note-parser/main";

import { createWorkerProxy } from "@/utils/worker";
import type { NoteParserWorkerAPI } from "@/worker/note-parser";
import ZoteroPlugin from "@/zt-main";

export class NoteParser extends Service {
  plugin = this.use(ZoteroPlugin);

  #url = toObjectURL(workerCode);
  #instance = workerpool.pool(this.#url, {
    minWorkers: 1,
    maxWorkers: 4,
    workerType: "iframe",
    // name: "Zotero Note Parser",
  });

  api = createWorkerProxy<NoteParserWorkerAPI>(this.#instance);

  onload(): void {
    return;
  }
  async onunload(): Promise<void> {
    await this.#instance.terminate();
    URL.revokeObjectURL(this.#url);
  }

  async parse(markdown: string) {
    return await this.api.parse(markdown);
  }
}
