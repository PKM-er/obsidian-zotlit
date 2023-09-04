import type { Stats } from "fs";
import { readFile, stat } from "fs/promises";
import { Service } from "@ophidian/core";
import type { DBSchema } from "idb";
import { openDB } from "idb";
import { Notice, loadPdfJs } from "obsidian";
import type _pdfjs from "pdfjs-dist";
import log from "@/log";
import type ZoteroPlugin from "@/zt-main";

export interface PDFOutline {
  level: number;
  page: number | null;
  title: string;
}

interface OutlineCacheValue {
  path: string;
  mtime: number;
  outline: PDFOutline[];
  created: number;
}

const dbName = "zotlit",
  pdfOutlineStore = "pdf-outline";

interface ZoteroPluginDB extends DBSchema {
  [pdfOutlineStore]: {
    key: string;
    value: OutlineCacheValue;
  };
}

export default class PDFParser extends Service {
  db = openDB<ZoteroPluginDB>(dbName, 1, {
    upgrade(db) {
      db.createObjectStore(pdfOutlineStore, { keyPath: "path" });
    },
  });

  constructor(public plugin: ZoteroPlugin) {
    super();
  }

  async getCachedOutlineKeys() {
    const db = await this.db;
    const keys = await db.getAllKeys(pdfOutlineStore);
    return keys;
  }

  async getPDFOutline(
    pdfPath: string,
    force = false,
  ): Promise<PDFOutline[] | null> {
    const db = await this.db;
    const cache = await db.get(pdfOutlineStore, pdfPath);
    let stats: Stats;
    try {
      stats = await stat(pdfPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        new Notice("PDF file not found");
        return null;
      } else {
        throw error;
      }
    }
    if (cache) {
      if (stats.mtimeMs === cache.mtime && !force) {
        log.debug("PDF outline cache hit", pdfPath);
        return cache.outline;
      }
    }
    const outline = await this.#parsePDFOutline(pdfPath);
    if (!outline) return null;
    // save to cache
    await db.put(pdfOutlineStore, {
      path: pdfPath,
      mtime: stats.mtimeMs,
      outline,
      created: Date.now(),
    });
    log.debug("PDF outline cache miss and updated", pdfPath);
    return outline;
  }

  pdfjs?: typeof _pdfjs;
  async #parsePDFOutline(pdfPath: string): Promise<PDFOutline[]> {
    this.pdfjs ??= (await loadPdfJs()) as typeof _pdfjs;

    const task = this.pdfjs.getDocument(await readFile(pdfPath));
    const doc = await task.promise;
    const outline = flatOutline(await doc.getOutline(), 0);

    const outlineWithPage = await Promise.all(
      outline.map(async ({ dest, ...rest }) => {
        if (!Array.isArray(dest)) return { ...rest, page: null };
        const [ref] = dest;
        const page = await doc.getPageIndex(ref);
        return { ...rest, page };
      }),
    );
    await doc.cleanup();
    await task.destroy();
    return outlineWithPage;
  }
}

type OutlineRaw = {
  title: string;
  dest: string | any[] | null;
  items: OutlineRaw[];
};
type OutlineFlat = {
  title: string;
  dest: string | any[] | null;
  level: number;
};

const flatOutline = (outline: OutlineRaw[], level: number): OutlineFlat[] =>
  outline.flatMap(({ title, dest, items }) => [
    { title, dest, level },
    ...flatOutline(items, level + 1),
  ]);
