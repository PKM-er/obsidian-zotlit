import { execFile as _execFile } from "child_process";
import type { Stats } from "fs";
import { stat } from "fs/promises";
import { promisify } from "util";
import type { DBSchema } from "idb";
import { openDB } from "idb";
import { Events, Notice } from "obsidian";
import queryString from "query-string";
import log from "./logger";
import type ZoteroPlugin from "./zt-main";
const execFile = promisify(_execFile);

export interface PDFOutline {
  leading: string;
  level: number;
  page: number;
  title: string;
  zoom: number[];
}

interface OutlineCacheValue {
  path: string;
  mtime: number;
  outline: PDFOutline[];
  created: number;
}

const dbName = "obsidian-zotero-plugin",
  pdfOutlineStore = "pdf-outline";

interface ZoteroPluginDB extends DBSchema {
  [pdfOutlineStore]: {
    key: string;
    value: OutlineCacheValue;
  };
}

const parseResult = (result: string) =>
  result.split("\n").map((line) =>
    line
      .trim()
      .split("\t")
      .reduce(
        (record, field, i, arr) => {
          if (i === 0) {
            record.leading = field;
          } else if (i === arr.length - 1) {
            Object.assign(
              record,
              queryString.parse(field, {
                arrayFormat: "comma",
                parseNumbers: true,
              }),
            );
          } else if (i === arr.length - 2) {
            record.title = field.replace(/^"|"$/g, "").replace('"', '"');
          } else if (field === "") {
            record.level += 1;
          } else {
            log.warn("unknown field", field, i, arr);
          }
          return record;
        },
        { level: 0 } as PDFOutline,
      ),
  );

export default class PDFCache extends Events {
  db = openDB<ZoteroPluginDB>(dbName, 1, {
    upgrade(db) {
      db.createObjectStore(pdfOutlineStore, { keyPath: "path" });
    },
  });

  constructor(public plugin: ZoteroPlugin) {
    super();
  }
  get mutool() {
    return this.plugin.settings.mutoolPath;
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
    const outline = await this.parsePDFOutline(pdfPath);
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

  async parsePDFOutline(pdfPath: string) {
    if (!this.mutool) {
      throw new Error("mutool not configured");
    }
    try {
      const { stdout, stderr } = await execFile(this.mutool, [
        "show",
        pdfPath,
        "outline",
      ]);
      if (stderr) {
        throw new Error(stderr);
      }
      if (stdout) {
        return parseResult(stdout);
      }
    } catch (error) {
      log.error(error);
    }
    return null;
  }
}
