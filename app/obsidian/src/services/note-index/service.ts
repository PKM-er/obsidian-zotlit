import { pipe } from "@mobily/ts-belt";

import { groupBy } from "@mobily/ts-belt/Array";
import { mapWithKey, values } from "@mobily/ts-belt/Dict";
import type { ItemKeyGroup } from "@obzt/common";
import { getItemKeyGroupID } from "@obzt/common";
import { Service, calc } from "@ophidian/core";
import type { CachedMetadata, Pos, TAbstractFile, TFile } from "obsidian";
import { App, Notice } from "obsidian";

import log from "@/log";
import { SettingsService, effect } from "@/settings/base";
import { isMarkdownFile } from "@/utils";
import { untilMetaReady } from "@/utils/once";
import ZoteroPlugin from "@/zt-main";
import {
  getItemKeyFromFrontmatter,
  isAnnotBlock,
  splitMultipleAnnotKey,
} from "./utils";

interface BlockInfo {
  blocks: Pos[];
  file: string;
  key: string;
}

export default class NoteIndex extends Service {
  plugin = this.use(ZoteroPlugin);
  settings = this.use(SettingsService);
  app = this.use(App);

  get meta() {
    return this.app.metadataCache;
  }
  get vault() {
    return this.app.vault;
  }

  @calc
  get literatureNoteFolder() {
    return this.settings.current?.literatureNoteFolder;
  }
  get joinPath() {
    return getFolderJoinPath(this.literatureNoteFolder);
  }

  /** key -> file[] */
  noteCache: Map<string, Set<string>> = new Map();
  blockCache = {
    byFile: new Map<string, readonly BlockInfo[]>(),
    byKey: new Map<string, Set<BlockInfo>>(),
  };
  citekeyCache: Map<string, Set<string>> = new Map();

  /**
   * @returns — true if cache has been updated
   */
  #setNoteCache(file: string, cache: CachedMetadata | null): boolean {
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

    const annotBlocks = sections.filter(isAnnotBlock);
    if (annotBlocks.length === 0) {
      return removeFile(file);
    }

    removeFile(file);

    const blockInfo = pipe(
      annotBlocks.flatMap((s) =>
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

  /**
   * @returns — true if cache has been updated
   */
  #setCitekeyCache(file: string, cache: CachedMetadata | null): boolean {
    const citekey = cache?.frontmatter?.citekey;

    if (citekey) {
      if (!this.citekeyCache.has(citekey)) {
        this.citekeyCache.set(citekey, new Set([file]));
        return true;
      }
      const files = this.citekeyCache.get(citekey)!;
      const prevSize = files.size;
      return files.add(file).size !== prevSize;
    }

    let updated = false;
    for (const [key, files] of this.citekeyCache.entries()) {
      const deleted = files.delete(file);
      updated ||= deleted;
      if (deleted && files.size === 0) {
        this.citekeyCache.delete(key);
      }
    }
    return updated;
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

    if (file && item) {
      if (!withinFile || !withKey) return [];
      return withinFile.filter((info) => withKey.has(info));
    }
    if (file) return withinFile ? [...withinFile] : [];
    if (item) return withKey ? [...withKey] : [];
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

    const results = [
      this.#setNoteCache(file, cache),
      this.#setBlockCache(file, cache),
      this.#setCitekeyCache(file, cache),
    ];
    if (results.some((updated) => updated)) {
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
    this.settings.once(() => {
      // plugin.register(() => this.buildFilemapWorker.terminate());
      [
        this.meta.on("changed", this.onMetaChanged, this),
        // this.vault.on("create") // also fired on meta.changed
        this.vault.on("rename", this.onFileRenamed, this),
        this.vault.on("delete", this.onFileRemoved, this),
      ].forEach(this.registerEvent.bind(this));

      const [task, cancel] = untilMetaReady(this.plugin.app, {});
      cancel && this.register(cancel);
      task.then(() => {
        this.onMetaBuilt();
        this.plugin.addCommand({
          id: "refresh-note-index",
          name: "Refresh literature notes index",
          callback: () => {
            this.reload();
            new Notice("Literature notes re-indexed");
          },
        });
      });
    });
    this.register(
      effect((initial) => {
        this.literatureNoteFolder;
        if (initial) return;
        this.reload();
      }),
    );
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

const getFolderJoinPath = (folder: string): string =>
  folder === "/" ? "" : folder + "/";
