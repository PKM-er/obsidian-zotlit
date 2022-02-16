import {
  CachedMetadata,
  Events,
  MetadataCache,
  TAbstractFile,
  TFile,
  TFolder,
  Vault,
} from "obsidian";

import type { Item } from "../zotero-types";
// import { PromiseWorker } from "../utils";
import ZoteroPlugin from "../zt-main";
import { getItemKeyGroupID } from "./utils";
// import type { Input, Output } from "./build-filemap.worker";
// import buildFilemap from "./build-filemap.worker.ts";
import { FileMapInfo, getZoteroKeyFileMap } from "./utils";

export { getItemKeyGroupID };
export default class ZoteroItems extends Events {
  get meta(): MetadataCache {
    return this.plugin.app.metadataCache;
  }
  get vault(): Vault {
    return this.plugin.app.vault;
  }
  get template() {
    return this.plugin.settings.literatureNoteTemplate;
  }

  fileMap: Map<string, FileMapInfo> = new Map();
  getNoteFromKey(
    ...args: [item: Item] | [key: string, groupId: number | undefined]
  ): FileMapInfo | undefined {
    return this.fileMap.get(getItemKeyGroupID(...args));
  }

  // buildFilemapWorker: PromiseWorker<Input, Output>;

  constructor(public plugin: ZoteroPlugin) {
    super();
    // this.buildFilemapWorker = new PromiseWorker<Input, Output>(buildFilemap);
    const folder = plugin.settings.literatureNoteFolder.path;
    this._folder = { folder, joinPath: getFolderJoinPath(folder) };
    // plugin.register(() => this.buildFilemapWorker.terminate());
    [
      this.meta.on("changed", this.onMetaChanged.bind(this)),
      this.meta.on("finished", this.onMetaBuilt.bind(this)),
      // this.vault.on("create") // also fired on meta.changed
      this.vault.on("rename", this.onFileMoved.bind(this)),
      this.vault.on("delete", this.onFileMoved.bind(this)),
    ].forEach(plugin.registerEvent.bind(plugin));
    if (this.meta.initialized) this.onMetaBuilt();
  }

  private _folder: {
    folder: string;
    joinPath: string;
  };
  public set noteFolder(folder: string) {
    if (this._folder.folder === folder) return;
    this._folder = { folder, joinPath: getFolderJoinPath(folder) };
    this.reload();
  }
  public get noteFolder(): string {
    return this._folder.folder;
  }

  /** check if file belongs to literature note folder */
  isLiteratureNote(file: string): boolean;
  isLiteratureNote(file: TAbstractFile): file is TFile;
  isLiteratureNote(file: TAbstractFile | string): boolean {
    if (typeof file === "string") {
      return file.endsWith(".md") && file.startsWith(this._folder.joinPath);
    } else
      return (
        file instanceof TFile &&
        file.extension === "md" &&
        file.path.startsWith(this._folder.joinPath)
      );
  }

  onMetaBuilt() {
    const folder = this.vault.getAbstractFileByPath(this._folder.folder);
    if (folder && folder instanceof TFolder)
      for (const file of getAllMarkdownIn(folder)) {
        this.addFileRecord(file);
      }
  }
  onMetaChanged(file: TFile, _data: string, cache: CachedMetadata) {
    if (!this.isLiteratureNote(file)) return;
    this.updateFileRecord(file, cache);
  }
  onFileMoved(file: TAbstractFile, oldPath?: string) {
    if (!(file instanceof TFile && file.extension === "md")) return;
    const isCurrNote = this.isLiteratureNote(file.path);
    if (oldPath) {
      // file renamed
      const isOldNote = this.isLiteratureNote(oldPath);
      if (!isCurrNote && !isOldNote) {
        return; // not inside note folder
      } else if (isCurrNote && isOldNote) {
        this.renameFileRecord(file, oldPath);
      } else if (isCurrNote) {
        this.addFileRecord(file);
      } else {
        this.removeFileRecord(oldPath);
      }
    } else {
      // file deleted
      if (!isCurrNote) return;
      this.removeFileRecord(file);
    }
  }

  addFileRecord(file: TFile | string): void {
    const path = getFilePath(file),
      cache = this.meta.getCache(path);
    this.updateFileRecord(path, cache);
  }
  removeFileRecord(file: TFile | string): void {
    const path = getFilePath(file);
    for (const [key, { file }] of this.fileMap.entries()) {
      if (file === path) {
        this.fileMap.delete(key);
      }
    }
  }
  renameFileRecord(file: TFile | string, oldPath: string): void {
    const path = getFilePath(file);
    for (const info of this.fileMap.values()) {
      if (info.file === oldPath) {
        info.file = path;
      }
    }
  }
  updateFileRecord(file: TFile | string, cache: CachedMetadata): void {
    const path = getFilePath(file);
    for (const kfMap of getZoteroKeyFileMap(path, cache)) {
      this.fileMap.set(...kfMap);
    }
  }

  reload(): void {
    this.fileMap.clear();
    this.onMetaBuilt();
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
const getFolderJoinPath = (folder: string): string =>
  folder === "/" ? "" : folder + "/";
