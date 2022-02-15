import Fuse from "fuse.js";
import { FileSystemAdapter } from "obsidian";
import indexCitation from "web-worker:./index-citation";

import { PromiseWorker } from "../promise-worker";
import { RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import type { Input, Output } from "./get-index";
import getIndex from "./get-index";

export default class ZoteroDb {
  fuse: Fuse<RegularItem> | null = null;
  items: Record<string, RegularItem> = {};

  indexCitationWorker: PromiseWorker<Input, Output> | null = null;

  constructor(private plugin: ZoteroPlugin) {}

  private get props() {
    return {
      dbPath: this.plugin.settings.zoteroDbPath,
      libraryID: 1,
    };
  }

  private get ConfigPath() {
    const { adapter, configDir } = this.plugin.app.vault;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getFullPath(configDir);
    } else throw new Error("Unsupported adapter");
  }

  async init() {
    if (this.indexCitationWorker) {
      this.indexCitationWorker.terminate();
      this.indexCitationWorker = null;
    }
    await this.refresh();
  }
  async initWithWorker() {
    if (!this.indexCitationWorker) {
      this.indexCitationWorker = new PromiseWorker<Input, Output>(
        indexCitation(this.ConfigPath),
      );
      this.plugin.register(() => this.indexCitationWorker?.terminate());
    }
    await this.refresh();
  }
  async refresh() {
    if (this.indexCitationWorker) {
      this.initIndexAndFuse(
        await this.indexCitationWorker.postMessage(this.props),
      );
    } else {
      this.initIndexAndFuse(await getIndex(this.props));
    }
  }

  initIndexAndFuse(args: Output) {
    this.items = args[0].reduce(
      (record, item) => ((record[item.key] = item), record),
      {} as Record<string, RegularItem>,
    );
    this.fuse = new Fuse(...args);
  }

  search(query: string[], matchField: string, limit = 20) {
    if (!this.fuse) return [];
    let exp = query.map<Fuse.Expression>((s) => ({ [matchField]: s }));
    return this.fuse.search({ $and: exp }, { limit });
  }
  getAll(limit = 20): Fuse.FuseResult<RegularItem>[] {
    let docs = (this.fuse?.getIndex() as any).docs as RegularItem[] | undefined;
    if (!docs) return [];
    docs = docs.slice(0, limit);
    return docs.map((item, index) => ({
      item,
      refIndex: index,
    }));
  }
}
