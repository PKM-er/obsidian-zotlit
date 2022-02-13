import Fuse from "fuse.js";

import { PromiseWorker } from "../promise-worker";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import type { Input, Output } from "./get-index";
import getIndex from "./get-index";
import indexCitation from "./index-citation.worker.ts";

export default class ZoteroDb {
  fuse: Fuse<RegularItem> | null = null;
  indexCitationWorker: PromiseWorker<Input, Output> | null = null;

  constructor(private plugin: ZoteroPlugin) {}

  private props = {
    dbPath: this.plugin.settings.zoteroDbPath,
    libraryID: 1,
  };

  async init() {
    const args = await getIndex(this.props);
    this.fuse = new Fuse(...args);
  }
  async initWithWorker() {
    this.indexCitationWorker = new PromiseWorker<Input, Output>(indexCitation);
    this.plugin.register(() => this.indexCitationWorker?.terminate());

    const args = await this.indexCitationWorker.postMessage(this.props);
    this.fuse = new Fuse(...args);
  }
}
