import { IframeWorkerHandler, WorkerPool } from "@aidenlx/workerpool";
import { Service } from "@ophidian/core";

import workerCode from "worker:@/worker-iframe/note-parser/main";

import type { NoteParserWorkerAPI } from "@/worker-iframe/note-parser/api";
import ZoteroPlugin from "@/zt-main";
class NoteParserkWorker extends IframeWorkerHandler {
  get code() {
    return workerCode;
  }
}
class NoteParserkWorkerPool extends WorkerPool<NoteParserWorkerAPI> {
  workerCtor() {
    return new NoteParserkWorker();
  }
}

export class NoteParser extends Service {
  plugin = this.use(ZoteroPlugin);

  instance = new NoteParserkWorkerPool();

  get api() {
    return this.instance.proxy;
  }

  onload(): void {
    return;
  }
  async onunload(): Promise<void> {
    await this.instance.terminate();
  }

  async parse(markdown: string) {
    return await this.api.parse(markdown);
  }
}
