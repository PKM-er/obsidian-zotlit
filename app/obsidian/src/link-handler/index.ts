import type { AnnotationItem, Item, RegularItem } from "@obzt/zotero-type";
import { assertNever } from "assert-never";
import { decode } from "js-base64";
import type { ObsidianProtocolData, ObsidianProtocolHandler } from "obsidian";
import log from "@log";

import type ZoteroPlugin from "../zt-main.js";
import { importAnnoItems } from "./import-annot.js";
import { importInfoItems } from "./import-info.js";
import openItemNote from "./open.js";

type ZoteroLinkParams = ObsidianProtocolData & {
  type: "annotation" | "info";
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZoteroLinkHandler = (params: ZoteroLinkParams) => any;
export type SendDataAnnoExport = {
  info: RegularItem;
  annotations: (AnnotationItem & {
    /** check if file exists in obsidian */
    imageUrl?: string | undefined;
  })[];
};
export type SendDataInfoExport = {
  info: RegularItem[];
};

const getHandlers = (
  ...handlers: { action: "open" | "export"; handler: ZoteroLinkHandler }[]
): [action: string, handler: ObsidianProtocolHandler][] =>
  handlers.map(({ action, handler }) => ["zotero/" + action, handler as never]);

const getZoteroLinkHandlers = (plugin: ZoteroPlugin) => {
  const openHandler: ZoteroLinkHandler = (params) => {
    const { type, ["annot-key"]: annotKey } = params;
    if (type === "annotation") {
      if (!annotKey) {
        log.error(
          'Invalid link from zotero: missing annotaion key in "open" url',
        );
        return;
      }
      openItemNote(plugin, params);
    } else if (type === "info") {
      openItemNote(plugin, params);
    } else assertNever(type);
  };

  const importHandler: ZoteroLinkHandler = (params) => {
    const { type, data: raw } = params,
      parsed = JSON.parse(decode(raw));
    if (type === "annotation") {
      const data = parsed as SendDataAnnoExport;
      data.annotations = fromJSONArray(data.annotations);
      data.info = fromJSON(data.info);
      log.debug("parsed zotero link: ", type, parsed);
      importAnnoItems(plugin, data);
    } else if (type === "info") {
      let shouldImport = true;
      if ("info-key" in params) {
        shouldImport = !openItemNote(plugin, params, true);
      }
      if (!shouldImport) return;
      const data = parsed as SendDataInfoExport;
      data.info = fromJSONArray(data.info);
      log.debug("parsed zotero link: ", type, parsed);
      importInfoItems(plugin, data);
    } else assertNever(type);
  };

  return getHandlers(
    {
      action: "open",
      handler: openHandler,
    },
    {
      action: "export",
      handler: importHandler,
    },
  );
};

export default getZoteroLinkHandlers;

const dateFields = ["accessDate", "dateAdded", "dateModified"] as const;
const jsonStrFields = ["annotationPosition"] as const;

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
const fromJSON = <T extends Item>(item: T): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = item as any;
  // make sure all date fields are converted to Date objects
  for (const field of dateFields) {
    if (field in json) {
      json[field] = new Date(json[field]);
    }
  }
  for (const field of jsonStrFields) {
    if (field in json) {
      json[field] = JSON.parse(json[field]);
    }
  }
  return json as T;
};
const fromJSONArray = <T extends Item>(items: T[]): T[] => {
  for (let i = 0; i < items.length; i++) {
    items[i] = fromJSON(items[i]);
  }
  return items;
};
