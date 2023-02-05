import { pipe } from "@mobily/ts-belt";

import { groupBy } from "@mobily/ts-belt/Array";
import { mapWithKey, values } from "@mobily/ts-belt/Dict";
import type { ItemKeyGroup } from "@obzt/common";
import { getItemKeyGroupID } from "@obzt/common";
import { Service } from "@ophidian/core";
import type { CachedMetadata, Pos, TAbstractFile, TFile } from "obsidian";
import { NoteIndexSettings } from "./settings";
import {
  getItemKeyFromFrontmatter,
  isAnnotCodeblock,
  splitMultipleAnnotKey,
} from "./utils";

import log from "@/log";
import { isMarkdownFile } from "@/utils";
import { untilMetaReady } from "@/utils/once";
import ZoteroPlugin from "@/zt-main";

declare module "obsidian" {
  interface MetadataCache {
    on(
      name: "zotero:index-update",
      callback: (file: string) => any,
      ctx?: any,
    ): EventRef;
    on(name: "zotero:index-clear", callback: () => any, ctx?: any): EventRef;
    trigger(name: "zotero:index-update", file: string): void;
    trigger(name: "zotero:index-clear"): void;
  }
}

interface BlockInfo {
  blocks: Pos[];
  file: string;
  key: string;
}

export default class NoteIndex extends Service {
  plugin = this.use(ZoteroPlugin);
  settings = this.use(NoteIndexSettings);

  get meta() {
    return this.plugin.app.metadataCache;
  }
  get vault() {
    return this.plugin.app.vault;
  }
  get template() {
    return this.plugin.settings.template;
  }

  /** key -> file[] */
  noteCache: Map<string, Set<string>> = new Map();
  blockCache = {
    byFile: new Map<string, readonly BlockInfo[]>(),
    byKey: new Map<string, Set<BlockInfo>>(),
  };

  /**
   * @returns — true if cache has been updated
   */
  #setFileCache(file: string, cache: CachedMetadata | null): boolean {
    const itemKey = getItemKeyFromFrontmatter(cache);

    if (itemKey) {
      if (!this.noteCache.has(itemKey)) {
        this.noteCache.set(itemKey, new Set([file]));
        return true;
      }
      const files = this.noteCache.get(itemKey)!;
      const prevSize = files.size;
      return files.add(file).size !== prevSize;
    }

    let updated = false;
    for (const [key, files] of this.noteCache.entries()) {
      const deleted = files.delete(file);
      updated ||= deleted;
      if (deleted && files.size === 0) {
        this.noteCache.delete(key);
      }
    }
    return updated;
  }

  /**
   * @returns — true if cache has been updated
   */
  #setBlockCache(file: string, cache: CachedMetadata | null): boolean {
    const removeFile = (file: string): boolean => {
      const blocks = this.blockCache.byFile.get(file);
      if (!blocks) return false;
      this.blockCache.byFile.delete(file);
      for (const block of blocks) {
        const blocks = this.blockCache.byKey.get(block.key)!;
        blocks.delete(block);
        if (blocks.size === 0) {
          this.blockCache.byKey.delete(block.key);
        }
      }
      return true;
    };
    if (!cache) {
      return removeFile(file);
    }

    const { blocks, sections } = cache;
    if (!sections || !blocks) {
      return removeFile(file);
    }

    const annotCodeblocks = sections.filter(isAnnotCodeblock);
    if (annotCodeblocks.length === 0) {
      return removeFile(file);
    }

    removeFile(file);

    const blockInfo = pipe(
      annotCodeblocks.flatMap((s) =>
        splitMultipleAnnotKey(s.id!).map((key) => [key, s.position] as const),
      ),
      groupBy(([key]) => key),
      mapWithKey(
        (key, pos): BlockInfo => ({
          file,
          key: key as string,
          blocks: pos.map(([_, pos]) => pos),
        }),
      ),
      values,
    );

    this.blockCache.byFile.set(file, blockInfo);
    for (const info of blockInfo) {
      const blocks = this.blockCache.byKey.get(info.key);
      if (!blocks) {
        this.blockCache.byKey.set(info.key, new Set([info]));
      } else {
        blocks.add(info);
      }
    }
    return true;
  }

  getNotesFor(item: ItemKeyGroup): string[] {
    const files = this.noteCache.get(getItemKeyGroupID(item, true));
    if (!files) return [];
    return [...files];
  }
  getBlocksFor({
    file,
    item,
  }: Partial<{ item: ItemKeyGroup; file: string }>): BlockInfo[] {
    if (!file && !item) {
      throw new Error("no file or item provided");
    }
    const withKey = item
        ? this.blockCache.byKey.get(getItemKeyGroupID(item, true))
        : null,
      withinFile = file ? this.blockCache.byFile.get(file) : null;

    if (withinFile && withKey) {
      return withinFile.filter((info) => withKey.has(info));
    }
    if (withinFile) return [...withinFile];
    if (withKey) return [...withKey];
    return [];
  }
  getBlocksIn(file: string): BlockInfo[] | null {
    const info = this.blockCache.byFile.get(file);
    if (!info) return null;
    return [...info];
  }

  #setFile(file: string, cache?: CachedMetadata | null) {
    if (cache === undefined) {
      cache = this.meta.getCache(file);
    }

    const fileUpdated = this.#setFileCache(file, cache),
      blockUpdated = this.#setBlockCache(file, cache);
    if (fileUpdated || blockUpdated) {
      this.meta.trigger("zotero:index-update", file);
    }
  }
  #removeFile(file: string) {
    this.#setFile(file, null);
  }
  #clear() {
    this.noteCache.clear();
    this.blockCache.byFile.clear();
    this.blockCache.byKey.clear();
    this.meta.trigger("zotero:index-clear");
  }

  onload(): void {
    // plugin.register(() => this.buildFilemapWorker.terminate());
    [
      this.meta.on("changed", this.onMetaChanged, this),
      // this.vault.on("create") // also fired on meta.changed
      this.vault.on("rename", this.onFileRenamed, this),
      this.vault.on("delete", this.onFileRemoved, this),
    ].forEach(this.registerEvent.bind(this));

    untilMetaReady(this.plugin.app, {
      onRegister: (r) => this.registerEvent(r),
    }).then(() => this.onMetaBuilt());
  }

  onMetaBuilt() {
    for (const file of this.vault.getMarkdownFiles()) {
      this.#setFile(file.path);
    }
  }
  onMetaChanged(file: TFile, _data: string, cache: CachedMetadata) {
    this.#setFile(file.path, cache);
  }

  onFileRemoved(file: TAbstractFile) {
    if (!isMarkdownFile(file)) return;
    this.#removeFile(file.path);
  }
  onFileRenamed(file: TAbstractFile, oldPath: string) {
    this.#removeFile(oldPath);
    if (isMarkdownFile(file)) {
      this.#setFile(file.path);
    }
  }

  reload(): void {
    this.#clear();
    this.onMetaBuilt();
    log.info("Note Index: Reloaded");
  }
}
