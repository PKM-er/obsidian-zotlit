import assertNever from "assert-never";
import { decode } from "js-base64";
import log from "loglevel";
import { ObsidianProtocolData, ObsidianProtocolHandler } from "obsidian";

import { AnnotationItem, Item, RegularItem } from "../zotero-types";
import ZoteroPlugin from "../zt-main";
import { importAnnoItems } from "./import-annot";
import { importInfoItems } from "./import-info";
import openItemNote from "./open";

type ZoteroLinkParams = ObsidianProtocolData & {
  type: "annotation" | "info";
};
type ZoteroLinkHandler = (params: ZoteroLinkParams) => any;
export type SendData_AnnoExport = {
  info: RegularItem;
  annotations: (AnnotationItem & {
    /** check if file exists in obsidian */
    imageUrl?: string | undefined;
  })[];
};
export type SendData_InfoExport = {
  info: RegularItem[];
};

const getHandlers = (
  ...handlers: { action: "open" | "export"; handler: ZoteroLinkHandler }[]
): [action: string, handler: ObsidianProtocolHandler][] =>
  handlers.map(({ action, handler }) => ["zotero/" + action, handler as any]);

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

  const importHandler: ZoteroLinkHandler = ({ type, data: raw }) => {
    const parsed = JSON.parse(decode(raw));
    if (type === "annotation") {
      const data = parsed as SendData_AnnoExport;
      data.annotations = fromJSONArray(data.annotations);
      data.info = fromJSON(data.info);
      log.debug("parsed zotero link: ", type, parsed);
      importAnnoItems(plugin, data);
    } else if (type === "info") {
      const data = parsed as SendData_InfoExport;
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

const DateFields = ["accessDate", "dateAdded", "dateModified"] as const;

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
const fromJSON = <T extends Item>(item: T): T => {
  // make sure all date fields are converted to Date objects
  const json = item as Partial<
    Record<KeysMatching<RegularItem, Date | undefined>, any>
  >;
  for (const field of DateFields) {
    if (field in json) {
      json[field] = new Date(json[field]);
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
