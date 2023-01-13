import type { ItemKeyGroup, KeyFileInfo } from "@obzt/common";
import { getItemKeyGroupID } from "@obzt/common";
import { Service } from "@ophidian/core";
import { assertNever } from "assert-never";
import type {
  BlockCache,
  CachedMetadata,
  MetadataCache,
  TAbstractFile,
  Vault,
} from "obsidian";
import { TFile, TFolder } from "obsidian";
import log from "@log";

import ZoteroPlugin from "../zt-main.js";
import { NoteIndexSettings } from "./settings.js";
import getZoteroKeyFileMap, { getItemKeyOf } from "./ztkey-file-map.js";

export { getItemKeyGroupID };

declare module "obsidian" {
  interface MetadataCache {
    on(
      name: "zotero:index-update",
      callback: (
        key: string,
        prev: KeyFileInfo | null,
        curr: KeyFileInfo | null,
      ) => any,
      ctx?: any,
    ): EventRef;
    on(name: "zotero:index-clear", callback: () => any, ctx?: any): EventRef;
    trigger(
      name: "zotero:index-update",
      key: string,
      prev: KeyFileInfo | undefined,
      curr: KeyFileInfo | undefined,
    ): void;
    trigger(name: "zotero:index-clear"): void;
  }
}
export default class NoteIndex extends Service {
  get meta(): MetadataCache {
    return this.plugin.app.metadataCache;
  }
  get vault(): Vault {
    return this.plugin.app.vault;
  }
  get template() {
    return this.plugin.settings.template;
  }
  settings = this.use(NoteIndexSettings);

  keyFileMap: Map<string, KeyFileInfo> = new Map();
  #set(key: string, value: KeyFileInfo) {
    const prev = this.keyFileMap.get(key);
    this.keyFileMap.set(key, value);
    app.metadataCache.trigger("zotero:index-update", key, prev, value);
  }

  /**
   * @returns true if an element in the Map existed and has been removed, or false if the element does not exist.
   */
  #delete(key: string) {
    const prev = this.keyFileMap.get(key);
    const result = this.keyFileMap.delete(key);
    app.metadataCache.trigger("zotero:index-update", key, prev, undefined);
    return result;
  }
  #clear() {
    this.keyFileMap.clear();
    app.metadataCache.trigger("zotero:index-clear");
  }
  deleteFromIndex(k: string, use: "itemKey" | "file"): boolean {
    if (use === "itemKey") {
      return this.#delete(k);
    } else if (use === "file") {
      let match = false;
      for (const [key, { file }] of this.keyFileMap) {
        if (file !== k) continue;
        this.#delete(key);
        match = true;
      }
      return match;
    } else assertNever(use);
  }

  getNoteFromItem(item: ItemKeyGroup): KeyFileInfo | undefined {
    log.debug("getNoteFromKey: ", item, getItemKeyGroupID(item, true));
    return this.keyFileMap.get(getItemKeyGroupID(item, true));
  }
  getBlockInfoFromItem(item: ItemKeyGroup): BlockCache | null {
    const note = this.getNoteFromItem(item);
    if (!note || !note.blockId) return null;
    const cache = this.meta.getCache(note.file);
    if (!cache) return null;
    const block = cache?.blocks?.[note.blockId.toLowerCase()];
    return block || null;
  }

  // buildFilemapWorker: PromiseWorker<Input, Output>;

  plugin = this.use(ZoteroPlugin);
  onload(): void {
    // plugin.register(() => this.buildFilemapWorker.terminate());
    [
      this.meta.on("changed", this.onMetaChanged.bind(this)),
      this.meta.on("finished", this.onMetaBuilt.bind(this)),
      // this.vault.on("create") // also fired on meta.changed
      this.vault.on("rename", this.onFileRenamed.bind(this)),
      this.vault.on("delete", this.onFileRemoved.bind(this)),
    ].forEach(this.registerEvent.bind(this));
    if (this.meta.initialized) this.onMetaBuilt();
  }

  getItemKeyOf(file: TAbstractFile | string): string | null {
    const path = getFilePath(file),
      itemKey = getItemKeyOf(path);
    if (!(itemKey && this.keyFileMap.has(itemKey))) return null;
    return itemKey;
  }

  isLiteratureNote(file: string): boolean;
  isLiteratureNote(file: TAbstractFile): file is TFile;
  isLiteratureNote(file: TAbstractFile | string): boolean {
    const path = getFilePath(file),
      itemKey = getItemKeyOf(path);
    if (!itemKey) return false;
    return this.keyFileMap.has(itemKey);
  }

  /** check if file belongs to literature note folder */
  #isLiteratureNote(file: string): boolean;
  #isLiteratureNote(file: TAbstractFile): file is TFile;
  #isLiteratureNote(file: TAbstractFile | string): boolean {
    if (typeof file === "string") {
      return file.endsWith(".md") && file.startsWith(this.settings.joinPath);
    } else
      return (
        file instanceof TFile &&
        file.extension === "md" &&
        file.path.startsWith(this.settings.joinPath)
      );
  }

  onMetaBuilt() {
    const folder = this.vault.getAbstractFileByPath(
      this.settings.literatureNoteFolder,
    );
    if (folder && folder instanceof TFolder)
      for (const file of getAllMarkdownIn(folder)) {
        this.addFileRecord(file);
      }
  }
  onMetaChanged(file: TFile, _data: string, cache: CachedMetadata) {
    if (!this.#isLiteratureNote(file)) {
      if (!this.getItemKeyOf(file)) return;
      this.removeFileRecord(file);
    } else {
      this.updateFileRecord(file, cache);
    }
  }

  onFileRemoved(file: TAbstractFile) {
    if (!this.#isLiteratureNote(file)) return;
    this.removeFileRecord(file);
  }
  onFileRenamed(file: TAbstractFile, oldPath: string) {
    const isCurrNote = this.#isLiteratureNote(file);
    // file renamed
    const isOldNote = this.#isLiteratureNote(oldPath);
    if (!isCurrNote && !isOldNote) {
      return; // not inside note folder
    } else if (isCurrNote && isOldNote) {
      this.renameFileRecord(file, oldPath);
    } else if (isCurrNote) {
      this.addFileRecord(file);
    } else {
      this.removeFileRecord(oldPath);
    }
  }

  addFileRecord(file: TFile | string): void {
    const path = getFilePath(file),
      cache = this.meta.getCache(path);
    if (cache) this.updateFileRecord(path, cache);
  }
  removeFileRecord(file: TFile | string): void {
    const path = getFilePath(file);
    this.deleteFromIndex(path, "file");
    log.debug("Note Index: Remove File Record", path, this.keyFileMap.size);
  }
  renameFileRecord(file: TFile | string, oldPath: string): void {
    const path = getFilePath(file);
    const info = [...this.keyFileMap.values()].find(
      ({ file }) => file === oldPath,
    );
    if (info) {
      info.file = path;
    }
    log.debug("Note Index: Rename File Record", path, this.keyFileMap.size);
  }
  updateFileRecord(file: TFile | string, cache: CachedMetadata): void {
    const path = getFilePath(file);
    const stillExist: Set<string> = new Set();
    for (const info of getZoteroKeyFileMap(path, cache)) {
      this.#set(info.key, info);
      stillExist.add(info.key);
    }
    // remove old records that no longer exist
    for (const [key, { file }] of this.keyFileMap) {
      if (file === path && !stillExist.has(key)) {
        this.#delete(key);
      }
    }
    log.debug("Note Index: Update File Record", path, this.keyFileMap.size);
  }

  reload(): void {
    this.#clear();
    this.onMetaBuilt();
    log.info("Note Index: Reloaded");
  }

  // trigger(name: string, ...data: any[]): void {}
}

function* getAllMarkdownIn(folder: TFolder): IterableIterator<TFile> {
  for (const af of folder.children) {
    if (af instanceof TFolder) {
      yield* getAllMarkdownIn(af);
    } else if (af instanceof TFile && af.extension === "md") {
      yield af;
    }
  }
}

const getFilePath = (file: TAbstractFile | string): string =>
  typeof file === "string" ? file : file.path;
